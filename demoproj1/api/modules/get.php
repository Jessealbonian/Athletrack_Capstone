<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

require_once "global.php";

class Get extends GlobalMethod
{
    private $pdo;
    public function __construct(\PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getImage()
    {
        try {
            $sql = "SELECT * FROM images";
            $stmt = $this->pdo->query($sql);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "message" => "Successfully retrieved images.",
                "data" => $result
            ];
        } catch (PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to retrieve images: " . $e->getMessage()
            ];
        }
    }

    public function getResidents()
    {
        try {
            $sql = "SELECT * FROM residents ORDER BY created_at DESC";
            $stmt = $this->pdo->query($sql);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "message" => "Successfully retrieved residents.",
                "data" => $result
            ];
        } catch (PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to retrieve residents: " . $e->getMessage()
            ];
        }
    }

    public function getResidentStats()
    {
        try {
            $sql = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending
                    FROM residents";

            $stmt = $this->pdo->query($sql);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "message" => "Successfully retrieved resident statistics.",
                "data" => [
                    "total" => (int)$result['total'],
                    "active" => (int)$result['active'],
                    "pending" => (int)$result['pending']
                ]
            ];
        } catch (PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to retrieve resident statistics: " . $e->getMessage()
            ];
        }
    }

    public function getPayments()
    {
        try {
            $sql = "SELECT * FROM payments ORDER BY date DESC";
            $stmt = $this->pdo->query($sql);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "message" => "Successfully retrieved payments.",
                "data" => $result
            ];
        } catch (PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to retrieve payments: " . $e->getMessage()
            ];
        }
    }

    public function getPaymentStats()
    {
        try {
            $sql = "SELECT 
                    SUM(amount) as total_collections,
                    SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END) as pending_amount,
                    SUM(CASE WHEN status = 'Overdue' THEN amount ELSE 0 END) as overdue_amount
                    FROM payments";

            $stmt = $this->pdo->query($sql);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "message" => "Successfully retrieved payment statistics.",
                "data" => [
                    "total_collections" => (float)$result['total_collections'] ?? 0,
                    "pending_amount" => (float)$result['pending_amount'] ?? 0,
                    "overdue_amount" => (float)$result['overdue_amount'] ?? 0
                ]
            ];
        } catch (PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to retrieve payment statistics: " . $e->getMessage()
            ];
        }
    }

    public function getResidentUnits()
    {
        try {
            $sql = "SELECT unit, name FROM residents WHERE status = 'Active'";
            $stmt = $this->pdo->query($sql);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "message" => "Successfully retrieved resident units.",
                "data" => $result
            ];
        } catch (PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to retrieve resident units: " . $e->getMessage()
            ];
        }
    }

    public function getMaintenance()
    {
        try {
            $sql = "SELECT id, image, Address, resident_name, description, status, priority, request_date, assigned_to 
                    FROM maintenance ORDER BY request_date DESC";
            $stmt = $this->pdo->query($sql);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get the base URL for images
            $baseUrl = "http://localhost/demoproj1/api/uploads/maintenance/";
            
            // Append the full image URL to each maintenance request
            foreach ($result as &$maintenance) {
                if ($maintenance['image']) {
                    $maintenance['image'] = $baseUrl . $maintenance['image'];
                }
            }

            return [
                "status" => "success",
                "message" => "Successfully retrieved maintenance requests.",
                "data" => $result
            ];
        } catch (PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to retrieve maintenance requests: " . $e->getMessage()
            ];
        }
    }

    public function getMaintenanceStats()
    {
        try {
            $sql = "SELECT 
                    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as open_requests,
                    SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                    SUM(CASE WHEN status = 'Completed' 
                        AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
                        THEN 1 ELSE 0 END) as completed_this_week
                    FROM maintenance";

            $stmt = $this->pdo->query($sql);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            // Convert null values to 0
            $data = [
                "open_requests" => (int)($result['open_requests'] ?? 0),
                "in_progress" => (int)($result['in_progress'] ?? 0),
                "completed_this_week" => (int)($result['completed_this_week'] ?? 0)
            ];

            return [
                "status" => "success",
                "message" => "Successfully retrieved maintenance statistics.",
                "data" => $data
            ];
        } catch (PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to retrieve maintenance statistics: " . $e->getMessage()
            ];
        }
    }

    public function getDocuments()
    {
        try {
            $sql = "SELECT * FROM documents ORDER BY last_updated DESC";
            $stmt = $this->pdo->query($sql);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "message" => "Successfully retrieved documents.",
                "data" => $result
            ];
        } catch (PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to retrieve documents: " . $e->getMessage()
            ];
        }
    }

    public function getDocumentStats()
    {
        try {
            $sql = "SELECT 
                    COUNT(*) as total_documents,
                    SUM(CASE WHEN type = 'Rule' THEN 1 ELSE 0 END) as rules_count,
                    COUNT(DISTINCT CASE WHEN type = 'Form' THEN id END) as forms_count
                    FROM documents";

            $stmt = $this->pdo->query($sql);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "message" => "Successfully retrieved document statistics.",
                "data" => $result
            ];
        } catch (PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to retrieve document statistics: " . $e->getMessage()
            ];
        }
    }

    public function getPropertyById($id)
    {
        try {
            $sql = "SELECT prop_address FROM properties WHERE prop_id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($result) {
                return [
                    "status" => "success",
                    "message" => "Successfully retrieved property address.",
                    "data" => [
                        "address" => $result['prop_address']
                    ]
                ];
            } else {
                return [
                    "status" => "error",
                    "message" => "Property not found."
                ];
            }
        } catch (PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to retrieve property address: " . $e->getMessage()
            ];
        }
    }

    public function getEvents()
    {
        try {
            $sql = "SELECT * FROM events";
            $params = [];

            // If year and month are provided, filter by them
            if (isset($_GET['year']) && isset($_GET['month'])) {
                $sql .= " WHERE YEAR(date) = ? AND MONTH(date) = ?";
                $params = [$_GET['year'], $_GET['month']];
            }

            $sql .= " ORDER BY date, time";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Add full image URL path to each event
            foreach ($result as &$event) {
                if ($event['image']) {
                    // Check if image is already a full URL
                    if (!filter_var($event['image'], FILTER_VALIDATE_URL)) {
                        $event['image'] = $this->getImageUrl($event['image']);
                    }
                }
            }

            return [
                "status" => "success",
                "message" => "Successfully retrieved events.",
                "data" => $result
            ];
        } catch (PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to retrieve events: " . $e->getMessage()
            ];
        }
    }

    public function getEventStats()
    {
        try {
            $sql = "SELECT 
                    COUNT(*) as total_events,
                    SUM(CASE WHEN status = 'Upcoming' THEN 1 ELSE 0 END) as upcoming_events,
                    SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_events,
                    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_events,
                    SUM(attendees) as total_attendees
                    FROM events";

            $stmt = $this->pdo->query($sql);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "message" => "Successfully retrieved event statistics.",
                "data" => $result
            ];
        } catch (PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to retrieve event statistics: " . $e->getMessage()
            ];
        }
    }

    public function getPaymentTrends()
    {
        try {
            $sql = "SELECT month, collections, outstanding 
                    FROM payment_trends 
                    ORDER BY year, FIELD(month, 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec') 
                    LIMIT 6";

            $stmt = $this->pdo->query($sql);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $months = [];
            $collections = [];
            $outstanding = [];

            foreach ($result as $row) {
                $months[] = $row['month'];
                $collections[] = floatval($row['collections']);
                $outstanding[] = floatval($row['outstanding']);
            }

            return [
                "status" => "success",
                "message" => "Successfully retrieved payment trends.",
                "data" => [
                    "months" => $months,
                    "collections" => $collections,
                    "outstanding" => $outstanding
                ]
            ];
        } catch (PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to retrieve payment trends: " . $e->getMessage()
            ];
        }
    }

    public function getUpcomingEvents()
    {
        try {
            $sql = "SELECT title, date, time 
                    FROM events 
                    WHERE status = 'Upcoming' 
                    AND date >= CURDATE() 
                    ORDER BY date ASC, time ASC 
                    LIMIT 3";

            $stmt = $this->pdo->query($sql);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "message" => "Successfully retrieved upcoming events.",
                "data" => $result
            ];
        } catch (PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to retrieve upcoming events: " . $e->getMessage()
            ];
        }
    }

    public function getCommunityStats()
    {
        try {
            $sql = "SELECT 
                    (SELECT COUNT(*) FROM residents) as total_units,
                    (SELECT COUNT(*) FROM residents WHERE status = 'Active') as occupied_units,
                    (SELECT 
                        CASE 
                            WHEN COUNT(*) > 0 
                            THEN (COUNT(CASE WHEN status = 'Paid' THEN 1 END) * 100 / COUNT(*))
                            ELSE 0 
                        END
                    FROM payments 
                    WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                    ) as payment_compliance
                    FROM dual";

            $stmt = $this->pdo->query($sql);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "message" => "Successfully retrieved community stats.",
                "data" => [
                    "total_units" => (int)($result['total_units'] ?? 0),
                    "occupied_units" => (int)($result['occupied_units'] ?? 0),
                    "payment_compliance" => (int)($result['payment_compliance'] ?? 0)
                ]
            ];
        } catch (PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to retrieve community stats: " . $e->getMessage()
            ];
        }
    }

    // Add this helper function to the Get class
    private function getImageUrl($imagePath)
    {
        // Base URL should match your project structure
        $baseUrl = "http://localhost/demoproj1/api/uploads/events/";
        return $baseUrl . $imagePath;
    }

    public function getProperties() {
        try {
            $sql = "SELECT 
                        image, 
                        prop_name, 
                        prop_address, 
                        prop_size, 
                        prop_rooms, 
                        prop_baths, 
                        prop_status, 
                        prop_price, 
                        year_built, 
                        monthly_fee 
                    FROM properties";
            $stmt = $this->pdo->query($sql);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Add full image URL path to each property
            foreach ($result as &$property) {
                if ($property['image']) {
                    // Check if image is already a full URL
                    if (!filter_var($property['image'], FILTER_VALIDATE_URL)) {
                        $property['image'] = $this->getImageUrl($property['image']);
                    }
                }
            }
            
            return [
                "status" => "success",
                "message" => "Successfully retrieved properties.",
                "data" => $result
            ];
        } catch(PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to retrieve properties: " . $e->getMessage()
            ];
        }
    }

    public function getMaintenanceRequests() {
        try {
            $sql = "SELECT * FROM maintenance ORDER BY request_date DESC";
            $stmt = $this->pdo->query($sql);
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return [
                "status" => "success",
                "message" => "Successfully retrieved maintenance requests.",
                "data" => $result
            ];
        } catch (PDOException $e) {
            return [
                "status" => "error",
                "message" => "Failed to retrieve maintenance requests: " . $e->getMessage()
            ];
        }
    }
}

// Handle the request
try {
    $pdo = new PDO("mysql:host=localhost;dbname=home_hoa", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $get = new Get($pdo);

    // Get the action from query parameters
    $action = isset($_GET['action']) ? $_GET['action'] : '';

    // Call the appropriate method based on action
    switch ($action) {
        case 'getResidents':
            $result = $get->getResidents();
            break;
        case 'getResidentStats':
            $result = $get->getResidentStats();
            break;
        case 'getImage':
            $result = $get->getImage();
            break;
        case 'getPayments':
            $result = $get->getPayments();
            break;
        case 'getPaymentStats':
            $result = $get->getPaymentStats();
            break;
        case 'getResidentUnits':
            $result = $get->getResidentUnits();
            break;
        case 'getMaintenance':
            $result = $get->getMaintenance();
            break;
        case 'getMaintenanceStats':
            $result = $get->getMaintenanceStats();
            break;
        case 'getDocuments':
            $result = $get->getDocuments();
            break;
        case 'getDocumentStats':
            $result = $get->getDocumentStats();
            break;
        case 'getEvents':
            $result = $get->getEvents();
            break;
        case 'getEventStats':
            $result = $get->getEventStats();
            break;
        case 'getPaymentTrends':
            $result = $get->getPaymentTrends();
            break;
        case 'getUpcomingEvents':
            $result = $get->getUpcomingEvents();
            break;
        case 'getCommunityStats':
            $result = $get->getCommunityStats();
            break;
        case 'getProperties':
            $result = $get->getProperties();
            break;
        case 'getPropertyById':
            if (isset($_GET['id'])) {
                $result = $get->getPropertyById($_GET['id']);
             } else {
                 $result = [
                      "status" => "error",
                       "message" => "Property ID is required."
                   ];
            }
            break;
        case 'getMaintenanceRequests':
            $result = $get->getMaintenanceRequests();
            break;
        default:
            $result = [
                "status" => "error",
                "message" => "Invalid action specified"
            ];
    }

    echo json_encode($result);
} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Database connection failed: " . $e->getMessage()
    ]);
}
