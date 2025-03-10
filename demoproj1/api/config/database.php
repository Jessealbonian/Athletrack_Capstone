<?php

//set default timezone to manila
date_default_timezone_set('Asia/Manila');

//set request timeout
set_time_limit(1000);

//define sever/api constant variables

define("SERVER","localhost");
define("DATABASE","home_hoa");
define("USER","root");
define("PASSWORD","");
define("DRIVER","mysql");

class Connection{
    private $connectionString = DRIVER.":host=".SERVER.";dbname=".DATABASE.";charset=utf8mb4";
    private $pdo_options = [
        \PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        \PDO::ATTR_DEFAULT_FETCH_MODE =>\PDO::FETCH_ASSOC,
        \PDO::ATTR_EMULATE_PREPARES =>false
    ];

    public function connect(){
        return new \PDO($this-> connectionString,USER,PASSWORD,$this->pdo_options);
    }
}

?>