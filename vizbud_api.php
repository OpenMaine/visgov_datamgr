<?php

	$config = array(
		"allowedFiles" => array("expenses.json", "revenues.json", "funds.json", "home.json")
	);


	// LOAD, DECODE AND VALIDATE REQUEST
	$request = json_decode(file_get_contents('php://input'));
	if(!$request) exit("Bad request object.");

	extract((array) $request);

	if(!isset($api)) exit("Missing api.");

	switch($api){

		case "listBudgets" :
			$fileList = scandir("budgets");
			$budgetList = array();
			foreach($fileList as $f){
				if($f[0] != ".") {
					$path = "budgets" . DIRECTORY_SEPARATOR . $f . DIRECTORY_SEPARATOR . "schema.json";

					$schema = json_decode(file_get_contents($path));
					$budgetList[] = array(
						"slug" => $f,
						"schema" => $schema
					);
				}
			}
			exit(json_encode($budgetList));
		break;

		case "synchFile" :
			if(!isset($fileName)) exit("Missing fileName.");
			if(in_array($fileName, $config["allowedFiles"]) === false)
				exit("Target file must be expenses.json, revenues.json or funds.json");

			if(!isset($budgetSlug)) exit("Missing budget slug.");
			$budgetList = scandir("budgets");
			if(in_array($budgetSlug, $budgetList) === false)
				exit("Target budget doesn't exist.");

			$filePath = "budgets"  . DIRECTORY_SEPARATOR . $budgetSlug . DIRECTORY_SEPARATOR . $fileName;

			// IF THERE'S NEW DATA, OVERWRITE TARGETTED DATA FILE
			if(isset($newContents)) {
				$newContents = $newContents;
				file_put_contents( $filePath, $newContents);
			}

			// RETURN NEWLY UPDATED CONTENTS
			include( $filePath);

		break;

	}
