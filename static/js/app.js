//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; 						//stream from getUserMedia()
var rec; 							//Recorder.js object
var input; 							//MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext //audio context to help us record

var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);

var interval;

function startRecording() {
	console.log("recordButton clicked");

	/*
		Simple constraints object, for more advanced audio features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/

    var constraints = { audio: true, video:false }

 	/*
    	Disable the record button until we get a success or fail from getUserMedia() 
	*/

	recordButton.disabled = true;
	stopButton.disabled = false;

	/*
    	We're using the standard promise based getUserMedia() 
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/

	navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
		console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

		/*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device
		*/
		audioContext = new AudioContext();

		//update the format 
		document.getElementById("formats").innerHTML="Format: 1 channel pcm @ "+audioContext.sampleRate/1000+"kHz"

		/*  assign to gumStream for later use  */
		gumStream = stream;

		/* use the stream */
		input = audioContext.createMediaStreamSource(stream);

		/* 
			Create the Recorder object and configure to record mono sound (1 channel)
			Recording 2 channels  will double the file size
		*/
		rec = new Recorder(input,{numChannels:2})

		//start the recording process
		rec.record()

		console.log("Recording started");

		interval = setInterval(function() {
			rec.stop();
			//create the wav blob and pass it on to createDownloadLink
			rec.exportWAV(passToPy);
			console.log("Recording created");
			rec.clear();
			rec.record();
		}, 1000);

	}).catch(function(err) {
	  	//enable the record button if getUserMedia() fails
    	recordButton.disabled = false;
    	stopButton.disabled = true;
	});
}

function stopRecording() {
	console.log("stopButton clicked");

	//disable the stop button, enable the record too allow for new recordings
	stopButton.disabled = true;
	recordButton.disabled = false;

	//tell the recorder to stop the recording
	rec.stop();

	//stop microphone access
	gumStream.getAudioTracks()[0].stop();

	clearInterval(interval);
	rec.stop();
}

function passToPy(blob) {
	console.log(blob);

	var head = document.getElementsByTagName('head')[0];

	var fd=new FormData();
	fd.append("audio", blob, "filename.wav");

	console.log(fd.get("audio"));

	// Create a script element
	var script = document.createElement('script');

	// Set the source URL for the jQuery library
	script.src = 'https://code.jquery.com/jquery-3.6.3.min.js';

	head.appendChild(script);

	var classifier = new EdgeImpulseClassifier();
	classifier.init();

	$.ajax({
		type: 'POST',
		url: 'https://fierce-island-63387-9057c4513060.herokuapp.com/upload',
		data: fd,
		processData: false,
		contentType: false,
		success: function(response) {
			var features = response.split(',').map(x => Number(x.trim()))
			var results = classifier.classify(features);
			var arr = results["results"];
			var max = -1;
			var lmax;
			for(let i = 0; i < 31; i++) {
				if(arr[i]["value"] > max) {
					max = arr[i]["value"];
					lmax = arr[i]["label"];
				}
			}
			console.log("Animal: " + lmax);
			console.log("Value: " + JSON.stringify(max));
			if(max > 0.5) {
				document.getElementById("results").textContent = "Results: " + lmax;
			} else {
				document.getElementById("results").textContent = "Results: unknown";
			}
		},
		error: function(xhr, textStatus, errorThrown) {
			console.error("Error:", textStatus, errorThrown);
		}
	});
	console.log('File sent...')
}
