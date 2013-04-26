"use strict";

//var WEG_API_BASE_URL = "http://localhost:8080/api/v0/"; // for testing
var WEG_API_BASE_URL = "http://wavygallery.appspot.com/api/v0/";
var GADGETS_BUTTON_SELECTOR = ".insert-gadget";
var GADGETS_MENU_SELECTOR = ".js-gadget-popup-menu-container .internal-container";

// Used to save the cursor position in the wave
var activeRange;

function init() {
	//document.querySelector(GADGETS_BUTTON_SELECTOR).removeEventListener("click", init, false);
	
	// Stuff to the gadgets panel if it is not already there.
	// (This just checks for the existence of the search box.)
	if(!document.querySelector("#wegQuery")) {
		chrome.storage.sync.get("randButton", function(items) {
			if(items.randButton || items.randButton === undefined) {
				createRandomGadgetButton();
			}
		});
		createSearchContainer();
	}
	//setTimeout(focusSearchBox, 1);
}

function createRandomGadgetButton() {
	var randomButton = document.createElement("button");
	randomButton.className = "gadget-icon";
	randomButton.style.whiteSpace = "normal";
	randomButton.style.verticalAlign = "top";
	randomButton.style.boxShadow = "0px 1px 7px 0px rgba(0,0,0,0.5), inset 0 0 0 50px white";
	randomButton.innerHTML = "Insert a random gadget";
	randomButton.addEventListener("click", function(e) {
		if(randomButton.disabled) {
			return;
		}
		randomButton.disabled = true;
		randomButton.innerHTML = "Loading...";
		makeWEGAPICall("list.json?type=gadget", function(data) {
			randomButton.disabled = false;
			randomButton.innerHTML = "Insert a random gadget";
			insertGadget(data[Math.floor(Math.random() * data.length)].gadgetURL);
		});
	}, false);
	document.querySelector(GADGETS_MENU_SELECTOR).appendChild(randomButton);
}
function createSearchContainer() {
	function searchFor(query) {
		// Do not search if the search button is disabled
		if(searchButton.disabled) {
			return false;
		}
	
		if(query === "") {
			var buttons = document.querySelector(GADGETS_MENU_SELECTOR).getElementsByTagName("button");
			for(var i = 0; i < buttons.length; i++) {
				restoreButton(buttons[i]);
			}
		} else {
			query = "type:gadget " + query;
			
			// Change the search button to a loading icon
			searchButton.classList.add("search-icon-wait");
			searchButton.disabled = true;
	
			// Make the actual API call
			makeWEGAPICall("search.json?q=" + encodeURIComponent(searchBox.value), function(data) {
				searchButton.classList.remove("search-icon-wait");
				searchButton.disabled = false;
		
				if(data.length === 0) {
					return;
				}
		
				var buttons = document.querySelector(GADGETS_MENU_SELECTOR).getElementsByTagName("button");
		
				for(var i = 0; i < buttons.length; i++) {
					if(buttons[i].getAttribute("gadgeturl")) {
						if(i < data.length) {
							changeButton(buttons[i], data[i].title, data[i].gadgetURL, data[i].iconURL);
						} else {
							disableButton(buttons[i]);
						}
					}
				}
			});
		}
	}

	var searchBox = document.createElement("input");
	searchBox.id = "wegQuery";
	searchBox.type = "search";
	searchBox.style.WebkitAppearance = "none";
	searchBox.style.border = "1px solid #CCD9E5";
	searchBox.style.borderRadius = "5px";
	searchBox.style.outlineStyle = "none";
	searchBox.style.fontSize = "13px";
	searchBox.style.boxSizing = "border-box";
	searchBox.style.display = "block";
	searchBox.style.width = "100%";
	searchBox.style.height = "32px";
	searchBox.style.padding = "0 34px 0 7px";
	searchBox.placeholder = "Search the Wave Extensions Gallery";
	searchBox.addEventListener("mousedown", function(e) {
		focusSearchBox();
	}, false);
	searchBox.addEventListener("blur", function(e) {
		// Put the focus on the current blip.
		document.querySelector(".blip-container.active .editor").focus();
		// Put the cursor back in place.
		var sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(activeRange);
	}, false);

	var searchButton = document.createElement("button");
	searchButton.className = "search-icon";
	searchButton.style.border = "0 none transparent";
	searchButton.addEventListener("click", function(e) {
		// Take the focus out of the search box.
		// (This prevents a glitch that puts the wave in a read-only mode.)
		searchBox.blur();
		// Do the search.
		searchFor(searchBox.value);
	}, false);

	var searchContainer = document.createElement("div");
	searchContainer.style.position = "relative";
	searchContainer.style.width = "80%";
	searchContainer.style.marginBottom = "4px";
	searchContainer.addEventListener("mouseup", function(e) {
		// Prevent closing the gadgets menu when the search area is clicked.
		e.stopPropagation();
	}, false);
	searchContainer.addEventListener("keydown", function(e) {
		// Prevent closing the gadgets menu when the user types.
		e.stopPropagation();
	}, false);
	searchContainer.addEventListener("keypress", function(e) {
		e.stopPropagation();
	
		// If the Enter key was pressed...
		if(e.keyCode === 13) {
			// Stop the default action.
			e.preventDefault();
			// Take the focus out of the search box.
			// (This prevents a glitch that puts the wave in a read-only mode.)
			searchBox.blur();
			// Do the search.
			searchFor(searchBox.value);
			return false;
		}
	}, false);

	var gadgetsList = document.querySelector(GADGETS_MENU_SELECTOR);

	searchContainer.appendChild(searchBox);
	searchContainer.appendChild(searchButton);
	gadgetsList.parentElement.insertBefore(searchContainer, gadgetsList);
	gadgetsList.parentElement.parentElement.style.top = "-49px";
}

function focusSearchBox() {
	// Save the cursor's position in the wave.
	activeRange = window.getSelection().getRangeAt(0);
	// Put the cursor in the search box.
	document.querySelector("#wegQuery").focus();
}

function insertGadget(gadgetURL) {
	var gadgetsList = document.querySelector(GADGETS_MENU_SELECTOR);
	var gadgetButton = gadgetsList.querySelector("button");
	var oldURL = gadgetButton.getAttribute("gadgeturl");
	gadgetButton.setAttribute("gadgeturl", gadgetURL);
	gadgetButton.click();
	gadgetButton.setAttribute("gadgeturl", oldURL);
}
function changeButton(button, title, url, iconURL) {
	button.disabled = false;

	saveButtonAttributes(button);

	button.title = title;
	button.setAttribute("gadgeturl", url);

	if(iconURL) {
		button.style.background = "white url(" + iconURL + ") no-repeat 0 0";
		button.style.backgroundSize = "cover";
	}
}
function disableButton(button) {
	saveButtonAttributes(button);
	button.style.backgroundImage = "none";
	button.title = "";
	button.disabled = true;
}
function saveButtonAttributes(button) {
	if(!button.dataset.oldtitle) {
		button.dataset.oldtitle = button.title;
	}
	if(!button.dataset.oldgadgeturl) {
		button.dataset.oldgadgeturl = button.getAttribute("gadgetURL");
	}
}
function restoreButton(button) {
	button.disabled = false;

	if(button.dataset.oldgadgeturl) {
		button.setAttribute("gadgeturl", button.dataset.oldgadgeturl);
	}
	if(button.dataset.oldtitle) {
		button.title = button.dataset.oldtitle;
	}
	button.style.background = null;
	button.style.backgroundPosition = null;
}

function makeWEGAPICall(url, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", WEG_API_BASE_URL + url, true);
	xhr.onreadystatechange = function() {
		if(xhr.status === 200 && xhr.readyState === 4) {
			console.log(JSON.parse(xhr.responseText));
			callback(JSON.parse(xhr.responseText));
		}
	}
	xhr.send();
}

document.querySelector(GADGETS_BUTTON_SELECTOR).addEventListener("click", init, false);
