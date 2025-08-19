import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Client, Locale } from 'appwrite';
import { from, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppwriteService {
  private client: Client;

  constructor(private httpClient: HttpClient) {
    this.client = new Client();

    if (!environment.appwriteEndpoint || !/^https?:\/\//.test(environment.appwriteEndpoint)) {
      console.error('Invalid Appwrite endpoint. Expected full URL like https://fra.cloud.appwrite.io/v1');
    } else {
      this.client.setEndpoint(environment.appwriteEndpoint);
    }

    if (!environment.appwriteProjectId || /<PROJECT_ID>/i.test(environment.appwriteProjectId)) {
      console.error('Invalid Appwrite project ID. Replace the placeholder with your real Project ID.');
    } else {
      this.client.setProject(environment.appwriteProjectId);
    }
  }

  getAppwriteClient(): Client {
    return this.client;
  }

  /**
   * Calls Appwrite's public Locale endpoint to verify connectivity and CORS.
   * This endpoint is accessible to guests, unlike /health which requires health.read scope.
   */
  ping(): Observable<unknown> {
    const base = environment.appwriteEndpoint?.replace(/\/?$/, '');
    if (!base || !/^https?:\/\//.test(base)) {
      throw new Error(
        'Appwrite endpoint is missing or invalid. Set environment.appwriteEndpoint to a full URL like https://fra.cloud.appwrite.io/v1'
      );
    }
    const locale = new Locale(this.client);
    return from(locale.get());
  }
}


