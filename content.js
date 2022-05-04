document.body.style.border = "5px solid red";

function copyStuff() {
	setClipboard("testing?!?!!?");
	chrome.storage.sync.get("color", ({ color }) => {
        document.body.style.backgroundColor = color;
    });
}

function pasteStuff() {
	alert(window.location.href)
	window.open("http://www.google.com") 
}


document.addEventListener("keydown", (e) => {
	// case sensitive for key
	if (e.ctrlKey && e.key === 'Z') alert("c s z");

	if (e.key === 'V') pasteStuff();
	if (e.key === 'C') copyStuff();
});


// fetch('https://example.com/extension.json')
// 	.then(response => response.json())
// 	.then(data => alert(data.toString()))
// 	.catch((err) => alert(err));

document.querySelectorAll('.edit').forEach(function(button) {
	// Now do something with my button
});

[...document.querySelectorAll('.edit')].forEach(function(button) {
	// Now do something with my button
});


// https://stackoverflow.com/questions/3436102/copy-to-clipboard-in-chrome-extension
function setClipboard(text) {
	var copyFrom = document.createElement("textarea");
	copyFrom.textContent = text;
	document.body.appendChild(copyFrom);
	copyFrom.select();
	// document.execCommand('copy');
	navigator.clipboard.writeText(text)
	copyFrom.blur();
	document.body.removeChild(copyFrom);
}
