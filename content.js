// La pagina comunica con background.js e inserisce la descrizione nel campo alt

var lang = document.documentElement.lang;

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        //console.log(sender.tab ?
        //        "Message from a content script:" + sender.tab.url + " " + request.label:
        //        "Message from ImageReader for " + request.type);

        if (request.type === "lang") {
            
            // language request
            sendResponse({language: lang, farewell: "Done"});

        } else if(request.type === "alt") {
            
            // alt request
            var images = document.getElementsByTagName('img');
            var found = false;
            for (var i = 0; i < images.length; i++) {
                if (images[i].src === request.src) {
                    images[i].lang = request.language;
                    images[i].alt = request.label;
                    found = true;
                }
            }

            if(found) {
                sendResponse({farewell: "Done"});
            } else {
                sendResponse({farewell: "Image not found"});
            }
        }
    }
);
