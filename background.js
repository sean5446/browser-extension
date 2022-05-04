let color = '#3aa757';

chrome.runtime.onInstalled.addListener((details) => {
// 		server must have CORS setup/json content type
// 		<?php
// 		  header("Access-Control-Allow-Origin: *");
// 		  header('Content-Type: application/json; charset=utf-8');
// 		  echo '
// 		    { "test": "value" }
// 		  ';
// 		?>
		fetch('https://domain.com/extension.php')
			.then(response => response.json())
			.then(data => console.log(data))
			.catch((err) => { console.log(err) })

		chrome.storage.sync.set({color});
		console.log('Default background color set to %cgreen', `color: ${color}`);
		console.log(details)
});
