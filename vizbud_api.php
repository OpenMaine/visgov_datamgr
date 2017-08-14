<?php

	$config = array(
		"allowedFiles" => array("expenses.json", "revenues.json", "funds.json")
	);


	// LOAD, DECODE AND VALIDATE REQUEST
	$request = json_decode(file_get_contents('php://input'));
	if(!$request) exit("Bad request object.");
	extract($request);

	if(!isset($api)) exit("Missing api.");

	switch($api){

		case "listBudgets" :
			$budgetList = scandir("budgets");
			exit(json_encode($budgetList));
		break;

		case "synchFile" :
			if(!isset($fileName)) exit("Missing fileName.");
			if(in_array($fileName, $allowedFiles) === false)
				exit("Target file must be expenses.json, revenues.json or funds.json");

			// IF THERE'S NEW DATA, OVERWRITE TARGETTED DATA FILE
			if(isset($newContents)) {
				$newContents = $newContents;
				file_put_contents( $fileName, $newContents);
			}

			// RETURN NEWLY UPDATED CONTENTS
			include($fileName);

		break;

	}
