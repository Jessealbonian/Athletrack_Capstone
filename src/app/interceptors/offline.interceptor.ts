import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, from, throwError, of } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { OfflineStorageService } from '../services/offline-storage.service';
import { environment } from '../../environments/environment';

@Injectable()
export class OfflineInterceptor implements HttpInterceptor {
  constructor(private offlineStorage: OfflineStorageService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only intercept API requests
    if (!request.url.includes(environment.apiUrl) && !request.url.includes('/api/')) {
      return next.handle(request);
    }

    const cacheKey = this.getCacheKey(request);

    // Check if we're online
    if (navigator.onLine) {
      // Online: try network first, cache on success
      return next.handle(request).pipe(
        tap((event) => {
          if (event instanceof HttpResponse && event.ok) {
            // Cache successful responses
            this.offlineStorage.cacheData(cacheKey, event.body, 24 * 60 * 60 * 1000).catch(err => {
              console.error('Error caching data:', err);
            }); // 24 hour TTL
          }
        }),
        catchError((error: HttpErrorResponse) => {
          // Network error - try cache
          console.log('Network error, trying cache:', request.url);
          return this.tryCacheOrQueue(request, cacheKey);
        })
      );
    } else {
      // Offline: try cache first, queue if needed
      return this.tryCacheOrQueue(request, cacheKey);
    }
  }

  private tryCacheOrQueue(request: HttpRequest<any>, cacheKey: string): Observable<HttpEvent<any>> {
    // Try to get from cache
    return from(this.offlineStorage.getCachedData(cacheKey)).pipe(
      switchMap((cachedData) => {
        if (cachedData) {
          // Return cached data
          console.log('Serving from cache:', cacheKey);
          return of(
            new HttpResponse({
              body: cachedData,
              status: 200,
              statusText: 'OK (Cached)',
              url: request.url
            })
          );
        } else {
          // No cache - queue for sync if it's a POST/PUT/DELETE
          if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
            this.queueRequestForSync(request).catch(err => {
              console.error('Error queueing request:', err);
            });
          }

          // Return error response
          return throwError(() => new HttpErrorResponse({
            error: {
              message: 'Network unavailable and no cached data found',
              offline: true
            },
            status: 503,
            statusText: 'Service Unavailable',
            url: request.url
          }));
        }
      }),
      catchError(() => {
        // If cache lookup fails, return error
        return throwError(() => new HttpErrorResponse({
          error: {
            message: 'Network unavailable and cache access failed',
            offline: true
          },
          status: 503,
          statusText: 'Service Unavailable',
          url: request.url
        }));
      })
    );
  }

  private getCacheKey(request: HttpRequest<any>): string {
    // Create a unique cache key from URL and method
    try {
      const url = new URL(request.url);
      return `${request.method}:${url.pathname}${url.search}`;
    } catch {
      return `${request.method}:${request.url}`;
    }
  }

  private async queueRequestForSync(request: HttpRequest<any>): Promise<void> {
    try {
      const body = request.body ? JSON.parse(JSON.stringify(request.body)) : null;
      await this.offlineStorage.queueForSync(
        request.url,
        request.method,
        body,
        this.getHeaders(request)
      );
      console.log('Request queued for sync:', request.url);
    } catch (error) {
      console.error('Error queueing request for sync:', error);
    }
  }

  private getHeaders(request: HttpRequest<any>): any {
    const headers: any = {};
    request.headers.keys().forEach((key) => {
      headers[key] = request.headers.get(key);
    });
    return headers;
  }
}

