window.addEventListener("load", function() {
	var randButtonSetting = document.getElementById("randButtonSetting");
	
	randButtonSetting.addEventListener("click", function(e) {
		var value = e.target.checked;
		e.target.checked = !value;
		e.target.disabled = true;
		chrome.storage.sync.set({"randButton": value}, function() {
			e.target.checked = value;
			e.target.disabled = false;
		});
	}, false);
	
	chrome.storage.sync.get("randButton", function(items) {
		if(items.randButton !== undefined) {
			randButtonSetting.checked = items.randButton;
		}
		randButtonSetting.disabled = false;
	});
}, false);
