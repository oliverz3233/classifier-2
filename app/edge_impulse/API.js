uploadButton.addEventListener("submit", function(e) {
	console.log("0")
	e.preventDefault();

	const userFile = document.getElementById('file').files[0];
	
	const formData = new FormData();
	formData.append('user-file', userFile, 'user-file.wav');
	
	fetch('https://ingestion.edgeimpulse.com/api/anomaly/files', {
	method: 'POST',
	headers: {
	  'x-api-key': 'ei_5cf10097b6661fc9e5067e0934358cd93bf5a4c7e839e08087aad2e571c2e4ef',
	  'Content-Type': 'multipart/form-data'
	},
	body: formData
	});
});
