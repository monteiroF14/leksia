const recognition = new webkitSpeechRecognition() || new SpeechRecognition();

recognition.lang = 'en-US'; // should follow BCP 47 syntax
recognition.continuous = true; //stops only when recognition.stop
recognition.interimResults = false;

recognition.onresult = (event) => {
	const transcript = event.results[0][0].transcript;
	console.log('You said:', transcript);
};

recognition.onerror = (event) => {
	console.error('Error:', event.error);
};

recognition.start();
recognition.stop();
