<?php   

header('Access-Control-Allow-Origin: *');


header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');

header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token, Origin, Authorization');


header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");

    exit(0);
}

    require_once "./modules/get.php";
    require_once "./modules/post.php";
    require_once "./config/database.php";

    $conn = new Connection();
    $pdo = $conn->connect();

    // Initialize Get and Post objects
    $get = new Get($pdo);
    $post = new Post($pdo);

    // Check if 'request' parameter is set in the request
    if(isset($_REQUEST['request'])){
         // Split the request into an array based on '/'
        $request = explode('/', $_REQUEST['request']);
    }
    else{
         // If 'request' parameter is not set, return a 404 response
        echo "Not Found";
        http_response_code(404);
    }

    // Handle requests based on HTTP method
    switch($_SERVER['REQUEST_METHOD']){
        // Handle GET requests
            case 'GET':
                switch($request[0]){
                    case 'getimages':
                        // Return JSON-encoded data for getting employees
                            echo json_encode($get->getImage());
                        break;

                        default:
                        // Return a 403 response for unsupported requests
                        echo "This is forbidden";
                        http_response_code(403);
                        break;
                }
                break;
        // Handle POST requests    
        case 'POST':
            switch ($request[0]) {
                case 'upload':
                    if (isset($_FILES['image'])) {
                        // Return JSON-encoded data for adding image
                        echo json_encode($post->addImage($_FILES['image']));
                    } else {
                        echo json_encode(['error' => 'No file uploaded.']);
                        http_response_code(400);
                    }
                    break;
            }
            break;
        default:
            // Return a 404 response for unsupported HTTP methods
            echo "Method not available";
            http_response_code(404);
        break;
    }

?>