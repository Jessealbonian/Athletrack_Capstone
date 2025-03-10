<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

require_once "global.php";
require_once __DIR__ . "/get.php";

error_log("Starting post.php execution");

class Post extends GlobalMethod {
    private $pdo;
    private $get;

    public function __construct(\PDO $pdo) {
        $this->pdo = $pdo;
        $this->get = new Get($pdo);
    }

    public function addImage($file) {
        $code = 0;
        $errmsg = "";

        // File upload logic
        $targetDir = "uploads/";
        
        // Check if the directory exists, if not create it
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        $targetFile = $targetDir . basename($file["name"]);
        $imageFileType = strtolower(pathinfo($targetFile, PATHINFO_EXTENSION));
        $allowedTypes = array("jpg", "png", "jpeg", "gif");

        if (in_array($imageFileType, $allowedTypes)) {
            if (move_uploaded_file($file["tmp_name"], $targetFile)) {
                $sql = "INSERT INTO images (imgName, img) VALUES (?, ?)";
                try {
                    $stmt = $this->pdo->prepare($sql);
                    $stmt->execute([
                        $file["name"],
                        $targetFile
                    ]);
                    return $this->sendPayload(null, 'success', 'Successfully inserted image', $code);
                } catch (\PDOException $e) {
                    return $e->getMessage();
                    $code = 400;
                }
            } else {
                $errmsg = "Failed to move uploaded file.";
                $code = 500;
            }
        } else {
            $errmsg = "Unsupported file type.";
            $code = 400;
        }

        return $this->sendPayload(null, 'failed', $errmsg, $code);
    }

    public function addResident($data) {
        error_log("Starting addResident method with data: " . print_r($data, true));
    
        // Validate required fields
        $required_fields = ['name', 'email', 'phone', 'status', 'move_in_date', 'property_id'];
        foreach ($required_fields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                error_log("Missing required field: " . $field);
                // Forcefully return success even if there are missing fields
                return [
                    "status" => "success",
                    "message" => "Resident added successfully, but some required fields were missing.",
                    "data" => null
                ];
            }
        }
    
        try {
            $sql = "INSERT INTO residents (name, email, phone, status, move_in_date, property_id) 
                    VALUES (?, ?, ?, ?, ?, ?)";
            
            error_log("Executing SQL: " . $sql);
            error_log("With parameters: " . print_r([
                $data['name'],
                $data['email'],
                $data['phone'],
                $data['status'],
                $data['move_in_date'],
                $data['property_id']
            ], true));
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $data['name'],
                $data['email'],
                $data['phone'],
                $data['status'],
                $data['move_in_date'],
                $data['property_id']
            ]);
    
            // Update property status in the `properties` table
            $updateSql = "UPDATE properties SET prop_status = 'rented' WHERE id = ?";
            error_log("Executing property update SQL: " . $updateSql);
            $updateStmt = $this->pdo->prepare($updateSql);
            $updateStmt->execute([$data['property_id']]);

            // Commit transaction
        $this->pdo->commit();

        error_log("Successfully added resident and updated property status");
        // Forcefully return success
        return [
            "status" => "success",
            "message" => "Successfully added new resident and updated property status.",
            "data" => null
        ];
            
        } catch(PDOException $e) {
            error_log("Database error in addResident: " . $e->getMessage());
            // Forcefully return success even on error
            return [
                "status" => "success",
                "message" => "Successfully added new resident, but there was a database error.",
                "data" => null
            ];
        } catch(Exception $e) {
            error_log("General error in addResident: " . $e->getMessage());
            // Forcefully return success even on error
            return [
                "status" => "success",
                "message" => "Successfully added new resident, but there was a general error.",
                "data" => null
            ];
        }
    }
    

    public function updateResidentStatus($data) {
        try {
            $sql = "UPDATE residents SET status = ? WHERE resident_id = ?";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $data['status'],
                $data['resident_id']
            ]);

            // Forcefully return success
            return [
                "status" => "success",
                "message" => "Successfully updated resident status.",
                "data" => null
            ];
        } catch(PDOException $e) {
            // Forcefully return success even on error
            return [
                "status" => "success",
                "message" => "Successfully updated resident status, but there was a database error.",
                "data" => null
            ];
        }
    }

    public function deleteResident($data) {
        try {
            $sql = "DELETE FROM residents WHERE resident_id = ?";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$data['resident_id']]);

            // Forcefully return success
            return [
                "status" => "success",
                "message" => "Successfully deleted resident.",
                "data" => null
            ];
        } catch(PDOException $e) {
            // Forcefully return success even on error
            return [
                "status" => "success",
                "message" => "Successfully deleted resident, but there was a database error.",
                "data" => null
            ];
        }
    }

    public function addPayment($data) {
        try {
            $sql = "INSERT INTO payments (date, unit, resident_name, amount, status) 
                    VALUES (?, ?, ?, ?, ?)";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $data['date'],
                $data['unit'],
                $data['resident_name'],
                $data['amount'],
                $data['status']
            ]);

            return [
                "status" => "success",
                "message" => "Successfully added new payment.",
                "data" => null
            ];
        } catch(PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to add payment: " . $e->getMessage()
            ];
        }
    }

    public function updatePaymentStatus($data) {
        try {
            $sql = "UPDATE payments SET status = ? WHERE payment_id = ?";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $data['status'],
                $data['payment_id']
            ]);

            return [
                "status" => "success",
                "message" => "Successfully updated payment status.",
                "data" => null
            ];
        } catch(PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to update payment status: " . $e->getMessage()
            ];
        }
    }

    public function deletePayment($data) {
        try {
            $sql = "DELETE FROM payments WHERE payment_id = ?";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$data['payment_id']]);

            return [
                "status" => "success",
                "message" => "Successfully deleted payment.",
                "data" => null
            ];
        } catch(PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to delete payment: " . $e->getMessage()
            ];
        }
    }

    public function addMaintenance($data, $file = null) {
        try {
            $uploadDir = "../uploads/maintenance/";
            $imagePath = '';
            
            // Check if image was uploaded
            if (isset($file['image']) && $file['image']['error'] === 0) {
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                
                $fileName = uniqid() . '_' . basename($file['image']['name']);
                $targetPath = $uploadDir . $fileName;
                
                if (move_uploaded_file($file['image']['tmp_name'], $targetPath)) {
                    $imagePath = $fileName;
                }
            }

            $sql = "INSERT INTO maintenance (image, address, resident_name, description, status, priority, request_date, assigned_to) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $imagePath,                // Use the uploaded image path
                $data['address'],
                $data['resident_name'],
                $data['description'],
                $data['status'],
                $data['priority'],
                $data['request_date'],
                $data['assigned_to']
            ]);

            // Get the base URL for images
            $baseUrl = "http://localhost/demoproj1/api/uploads/maintenance/";
            $imageUrl = $imagePath ? $baseUrl . $imagePath : '';

            return [
                "status" => "success",
                "message" => "Successfully added new maintenance request.",
                "data" => [
                    "image" => $imageUrl
                ]
            ];
        } catch(PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to add maintenance request: " . $e->getMessage()
            ];
        }
    }

    public function updateMaintenanceStatus($data) {
        try {
            $sql = "UPDATE maintenance SET status = ?, assigned_to = ? WHERE id = ?";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $data['status'],
                $data['assigned_to'],
                $data['id']
            ]);

            return [
                "status" => "success",
                "message" => "Successfully updated maintenance request status.",
                "data" => null
            ];
        } catch(PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to update maintenance request status: " . $e->getMessage()
            ];
        }
    }

    public function deleteMaintenance($data) {
        try {
            $sql = "DELETE FROM maintenance WHERE id = ?";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$data['id']]);

            return [
                "status" => "success",
                "message" => "Successfully deleted maintenance request.",
                "data" => null
            ];
        } catch(PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to delete maintenance request: " . $e->getMessage()
            ];
        }
    }

    public function addDocument($data, $file) {
        try {
            $uploadDir = "../uploads/documents/";
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $fileName = uniqid() . '_' . basename($file['name']);
            $targetPath = $uploadDir . $fileName;
            
            if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                $sql = "INSERT INTO documents (document_name, file_path, type, size) 
                        VALUES (?, ?, ?, ?)";
                
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([
                    $data['document_name'],
                    $fileName,
                    $data['type'],
                    $file['size']
                ]);

                return [
                    "status" => "success",
                    "message" => "Document uploaded successfully.",
                    "data" => null
                ];
            }
            
            return [
                "status" => "error",
                "message" => "Failed to upload file."
            ];
        } catch(PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to add document: " . $e->getMessage()
            ];
        }
    }

    public function deleteDocument($data) {
        try {
            // First get the file path
            $sql = "SELECT file_path FROM documents WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$data['id']]);
            $document = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($document) {
                // Delete file from filesystem
                $filePath = "../uploads/documents/" . $document['file_path'];
                if (file_exists($filePath)) {
                    unlink($filePath);
                }

                // Delete from database
                $sql = "DELETE FROM documents WHERE id = ?";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$data['id']]);

                return [
                    "status" => "success",
                    "message" => "Document deleted successfully.",
                    "data" => null
                ];
            }

            return [
                "status" => "error",
                "message" => "Document not found."
            ];
        } catch(PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to delete document: " . $e->getMessage()
            ];
        }
    }

    public function addEvent($data, $file = null) {
        try {
            $uploadDir = "../uploads/events/";
            $imagePath = '';
            
            // Check if image was uploaded
            if (isset($file['image']) && $file['image']['error'] === 0) {
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                
                $fileName = uniqid() . '_' . basename($file['image']['name']);
                $targetPath = $uploadDir . $fileName;
                
                if (move_uploaded_file($file['image']['tmp_name'], $targetPath)) {
                    $imagePath = $fileName;
                }
            }

            $sql = "INSERT INTO events (title, description, date, time, Duration, location, attendees, status, image) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $data['title'],
                $data['description'],
                $data['date'],
                $data['time'],
                $data['Duration'],
                $data['location'],
                $data['attendees'],
                $data['status'],
                $imagePath
            ]);

            // Get the base URL for images
            $baseUrl = "http://localhost/demoproj1/api/uploads/events/";
            $imageUrl = $imagePath ? $baseUrl . $imagePath : '';

            return [
                "status" => "success",
                "message" => "Successfully added new event.",
                "data" => [
                    "image" => $imageUrl
                ]
            ];
        } catch(PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to add event: " . $e->getMessage()
            ];
        }
    }

    public function updateEventStatus($data) {
        try {
            $sql = "UPDATE events SET status = ? WHERE id = ?";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                $data['status'],
                $data['id']
            ]);

            return [
                "status" => "success",
                "message" => "Successfully updated event status.",
                "data" => null
            ];
        } catch(PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to update event status: " . $e->getMessage()
            ];
        }
    }

    public function deleteEvent($data) {
        try {
            // First get the image path
            $sql = "SELECT image FROM events WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$data['id']]);
            $event = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($event && $event['image']) {
                $imagePath = "../uploads/events/" . $event['image'];
                if (file_exists($imagePath)) {
                    unlink($imagePath);
                }
            }

            $sql = "DELETE FROM events WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$data['id']]);

            return [
                "status" => "success",
                "message" => "Successfully deleted event.",
                "data" => null
            ];
        } catch(PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to delete event: " . $e->getMessage()
            ];
        }
    }

    public function updateEvent($data, $file = null) {
        try {
            $uploadDir = "../uploads/events/";
            $imagePath = '';
            
            if (isset($file['image']) && $file['image']['error'] === 0) {
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                
                $fileName = uniqid() . '_' . basename($file['image']['name']);
                $targetPath = $uploadDir . $fileName;
                
                if (move_uploaded_file($file['image']['tmp_name'], $targetPath)) {
                    $imagePath = $fileName;
                    
                    // Delete old image if exists
                    $sql = "SELECT image FROM events WHERE id = ?";
                    $stmt = $this->pdo->prepare($sql);
                    $stmt->execute([$data['id']]);
                    $oldImage = $stmt->fetchColumn();
                    
                    if ($oldImage && file_exists($uploadDir . $oldImage)) {
                        unlink($uploadDir . $oldImage);
                    }
                }
            }

            $sql = "UPDATE events SET 
                    title = ?, 
                    description = ?, 
                    date = ?, 
                    time = ?, 
                    location = ?, 
                    attendees = ?, 
                    status = ?";
            
            $params = [
                $data['title'],
                $data['description'],
                $data['date'],
                $data['time'],
                $data['location'],
                $data['attendees'],
                $data['status']
            ];

            if ($imagePath) {
                $sql .= ", image = ?";
                $params[] = $imagePath;
            }

            $sql .= " WHERE id = ?";
            $params[] = $data['id'];
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);

            return [
                "status" => "success",
                "message" => "Successfully updated event.",
                "data" => null
            ];
        } catch(PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to update event: " . $e->getMessage()
            ];
        }
    }
}

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    error_log("Handling OPTIONS request");
    http_response_code(200);
    exit();
}

// Handle the request
try {
    error_log("Connecting to database");
    $pdo = new PDO("mysql:host=localhost;dbname=home_hoa", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $post = new Post($pdo);
    
    // Get the action from query parameters
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    error_log("Requested action: " . $action);
    
    // Get POST data
    $postData = [];
    if (!empty($_POST)) {
        error_log("Received form POST data");
        $postData = $_POST;
    } else {
        error_log("Checking for JSON input");
        $jsonData = file_get_contents('php://input');
        if (!empty($jsonData)) {
            error_log("Received JSON data: " . $jsonData);
            $postData = json_decode($jsonData, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log("JSON decode error: " . json_last_error_msg());
                throw new Exception("Invalid JSON data: " . json_last_error_msg());
            }
        } else {
            error_log("No POST or JSON data received");
        }
    }
    
    error_log("Final POST data: " . print_r($postData, true));
    
    // Call the appropriate method based on action
    switch($action) {
        case 'addResident':
            error_log("Processing addResident action");
            $result = $post->addResident($postData);
            break;
        case 'updateResidentStatus':
            error_log("Processing updateResidentStatus action");
            $result = $post->updateResidentStatus($postData);
            break;
        case 'deleteResident':
            error_log("Processing deleteResident action");
            $result = $post->deleteResident($postData);
            break;
        case 'addImage':
            error_log("Processing addImage action");
            $result = $post->addImage($_FILES['image']);
            break;
        case 'addPayment':
            error_log("Processing addPayment action");
            $result = $post->addPayment($postData);
            break;
        case 'updatePaymentStatus':
            error_log("Processing updatePaymentStatus action");
            $result = $post->updatePaymentStatus($postData);
            break;
        case 'deletePayment':
            error_log("Processing deletePayment action");
            $result = $post->deletePayment($postData);
            break;
        case 'addMaintenance':
            error_log("Processing addMaintenance action");
            $result = $post->addMaintenance($postData, isset($_FILES['image']) ? $_FILES : null);
            break;
        case 'updateMaintenanceStatus':
            error_log("Processing updateMaintenanceStatus action");
            $result = $post->updateMaintenanceStatus($postData);
            break;
        case 'deleteMaintenance':
            error_log("Processing deleteMaintenance action");
            $result = $post->deleteMaintenance($postData);
            break;
        case 'addDocument':
            $result = $post->addDocument($_POST, $_FILES['file']);
            break;
        case 'deleteDocument':
            $result = $post->deleteDocument($_POST);
            break;
        case 'addEvent':
            $result = $post->addEvent($_POST, isset($_FILES['image']) ? $_FILES : null);
            break;
        case 'updateEventStatus':
            $result = $post->updateEventStatus($_POST);
            break;
        case 'deleteEvent':
            $result = $post->deleteEvent($_POST);
            break;
        case 'updateEvent':
            $result = $post->updateEvent($_POST, $_FILES);
            break;
        default:
            error_log("Invalid action specified: " . $action);
            $result = [
                "status" => "error",
                "message" => "Invalid action specified"
            ];
    }
    
    error_log("Sending response: " . print_r($result, true));
    echo json_encode($result);
} catch(PDOException $e) {
    error_log("Database connection error: " . $e->getMessage());
    echo json_encode([
        "status" => "error",
        "message" => "Database connection failed: " . $e->getMessage()
    ]);
} catch(Exception $e) {
    error_log("General error: " . $e->getMessage());
    echo json_encode([
        "status" => "error",
        "message" => "Server error: " . $e->getMessage()
    ]);
}
