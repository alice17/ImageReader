 /*function langChangeHandler() {

    if (document.getElementById('language').value != "en" && !document.getElementById('autolanguage').checked) {
        
        document.getElementById('models').disabled = true;
        
    } else {
        
        document.getElementById('models').disabled = false;
    }
}*/

function accuracyChangeHandler() {

     document.getElementById('accuracyText').textContent = String(document.getElementById('accuracy').value) + "%";
}

function saveOptions() {
    var bkg = chrome.extension.getBackgroundPage();
    
    bkg.OCR            = document.getElementById('text').checked;
    //bkg.MODELS          = document.getElementById('models').checked;
    bkg.PRIVATE         = document.getElementById('private').checked;
    bkg.AUTO_LANGUAGE   = document.getElementById('autolanguage').checked;
    bkg.API_KEY         = document.getElementById('key').value;
    bkg.OCR_API_KEY     = document.getElementById('ocrkey').value;
    bkg.LANGUAGE        = document.getElementById('language').value;
    bkg.ACCURACY        = document.getElementById('accuracy').value;
    
    bkg.updateClarifaiCredentials();
    
    chrome.storage.sync.set({
        
        apikey      : bkg.API_KEY,
        ocrkey      : bkg.OCR_API_KEY,
        ocr         : bkg.OCR,
        //models      : bkg.MODELS,
        private     : bkg.PRIVATE,
        autolang    : bkg.AUTO_LANGUAGE,
        lang        : bkg.LANGUAGE,
        accuracy    : bkg.ACCURACY
        
    }, function() {
        console.log("options saved");
        window.close();
  });
}

function restoreOptions() {
    var bkg = chrome.extension.getBackgroundPage();
    
    document.getElementById('text').checked         = bkg.OCR;
    //document.getElementById('models').checked       = bkg.MODELS;
    document.getElementById('private').checked      = bkg.PRIVATE;
    document.getElementById('autolanguage').checked = bkg.AUTO_LANGUAGE;
    document.getElementById('key').value            = bkg.API_KEY;
    document.getElementById('ocrkey').value         = bkg.OCR_API_KEY;
    document.getElementById('language').value       = bkg.LANGUAGE;
    document.getElementById('accuracy').value       = bkg.ACCURACY;  
    
    document.getElementById('accuracyText').textContent = String(bkg.ACCURACY) + "%";
    
    //langChangeHandler();
}  

function defaults() {
    var bkg = chrome.extension.getBackgroundPage();
    
    bkg.OCR             = false;
    bkg.MODELS          = false;
    bkg.PRIVATE         = false;
    bkg.AUTO_LANGUAGE   = false;
    bkg.LANGUAGE        = 'en';
    bkg.ACCURACY        = 95;
    
    restoreOptions();
}

//document.getElementById('language').addEventListener("change", langChangeHandler);
//document.getElementById('autolanguage').addEventListener("change", langChangeHandler);
document.getElementById('accuracy').addEventListener("input", accuracyChangeHandler);

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('restore').addEventListener('click', defaults);