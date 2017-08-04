var API_KEY = '';
var OCR_API_KEY = '';
var OCR = false;
var MODELS = false;
var PRIVATE = false;
var AUTO_LANGUAGE = false;
var LANGUAGE = 'en';
var ACCURACY = 95;
var MAX_RESULTS = 10;
var app;

// Carico le impostazioni all'avvio dell'estensione
chrome.storage.sync.get({

      apiuser     : '',
      apikey      : '',
      ocrkey      : '',
      ocr         : false,
      //models      : false,
      private     : false,
      autolang    : false,
      lang        : 'en',
      accuracy    : 95

  }, function(items) {

    API_KEY         = items.apikey;
    OCR_API_KEY         = items.ocrkey;
    OCR             = items.ocr;
    //MODELS          = items.models;
    PRIVATE         = items.private;
    AUTO_LANGUAGE   = items.autolang;
    LANGUAGE        = items.lang;
    ACCURACY        = items.accuracy;

    if( API_KEY ) {
        app = new Clarifai.App({apiKey: API_KEY});
    }
});

var buttonMessage;
switch(navigator.language){
    case 'en':
        buttonMessage = "Label image";
        break;
    case 'it':
        buttonMessage = "Descrivi immagine";
        break;
    case 'es':
        buttonMessage = "Describe la imagen";
        break;
    case 'de':
        buttonMessage = "Beschreibe das Bild";
        break;
    default:
        buttonMessage = "Label detection";
}

// Funzione che viene chiamata per gestire la modifica delle credenziali ai servizi
var updateClarifaiCredentials = function () {
    if( API_KEY ) {
        app = new Clarifai.App({apiKey: API_KEY});
    } else {
        // Le credenziali di Clarifai non sono valide
        switch(navigator.language){
            case 'en':
                notify("ImageReader", "Your Clarifai key or user ID are not valid, please check them in the options.");
                break;
            case 'it':
                notify("ImageReader", "I tuoi key o user ID di Clarifai non sono validi, per favore controllali nelle opzioni.");
                break;
            case 'es':
                notify("ImageReader", "Tus key o user ID de Clarifai no son válidos, por favor verificálos en las opciones.");
                break;
            default:
                notify("ImageReader", "Your Clarifai key or user ID are not valid, please check them in the options.");
        }
    }

    if (OCR && !OCR_API_KEY) {
        // Le credenziali di OCR.Space sono necessarie ma non sono valide
        switch(navigator.language) {
            case 'en':
                notify("ImageReader", "Your OCR.Space key is not valid, please check it in the options.");
                break;
            case 'it':
                notify("ImageReader", "La tua OCR.Space key non è valida, per favore controllala nelle opzioni.");
                break;
            case 'es':
                notify("ImageReader", "Tu OCR.Space key no es válida, por favor verificála en las opciones.");
                break;
            default:
                notify("ImageReader", "Your OCR.Space key is not valid, please check it in the options.");
        }
    }
}

// Funzione che gestisce il caricamento dell'immagine
var getImageData = function (url, public, callback) {
    var image = new Image();
    image.setAttribute('crossOrigin', 'anonymous');

    //console.log("Loading image");

    if (url.startsWith("file://") || url.startsWith("data:")) {
        //Se l'immagine è salvata sulla memoria locale mando il base64 sia a Clarifai che a OCR.space
        image.onload = function () {
            var maxDimension = 8388608;
            var canvas = document.createElement('canvas');
            var height = this.naturalHeight;
            var width = this.naturalWidth;
            canvas.height = height;
            canvas.width = width;
            var size = height * width * 24;
            var ctx = canvas.getContext("2d");

            // Costruisco un oggetto contente le info necessarie al labeling
            var result = {};

            // Se l'immagine è troppo grande e privata a Clarifai viene passata la rappresentazione base64
            ctx.drawImage(this, 0, 0, canvas.width, canvas.height);
            result.clariData = canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, '');

            // L'immagine viene ridimensionata fino a che non diventa più piccola di 1MB
            //console.log("Le dimensioni reali sono: " + width + " x " + height);
            while(size > maxDimension) {
                //console.log("La dimensione è: " + size + " quindi comprimo");
                canvas.width = canvas.width * 0.9;
                canvas.height = canvas.height * 0.9;
                size = canvas.width * canvas.height * 24;
                ctx.drawImage(this, 0, 0, canvas.width, canvas.height);
                //console.log("La nuova dimensione è: " + size);
            }

            //console.log("Le dimensioni finali sono: " + canvas.width + " x " + canvas.height);

            var ocrData = canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, '');

            $("body").append(ocrData);

            // In questo caso all'OCR viene sempre passata l'immagine in formato base64

            result.clariURL = false;
            result.ocrData = ocrData;
            result.ocrURL = false;

            callback(result);
        };
        image.src = url;
        //console.log("L'url è: " + url);
        return;
    }

    // Richiedo le informazioni su tipo e dimensione dell'immagine
    var maxDimension = 8388608;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if ( xhr.readyState === 4 ) {
            var generalType = xhr.getResponseHeader('Content-Type');
            var type = generalType.split(";")[0];
            //console.log("Image type: " + type);
            // Verifico che l'immagine abbia un formato supportato
            //console.log(xhr.status);
            if (xhr.status === 200 && (type === "image/jpeg" || type === "image/png" || type === "image/tiff" || type === "image/bmp")) {
                // Verifico se l'immagine rispetta i vincoli di dimensione per OCR.Space
                if (xhr.getResponseHeader('Content-Length') * 8 > maxDimension) {

                    //console.log("Image size too big");
                    image.onload = function () {
                        var canvas = document.createElement('canvas');
                        var height = this.naturalHeight;
                        var width = this.naturalWidth;
                        canvas.height = height;
                        canvas.width = width;
                        var size = xhr.getResponseHeader('Content-Length') * 8;
                        var ctx = canvas.getContext("2d");

                        // Costruisco un oggetto contente le info necessarie al labeling
                        var result = {};

                        if (public) {
                            // Se l'immagine è troppo grande e pubblica a Clarifai viene comunque passato l'URL
                            result.clariData = url;
                        } else {
                            // Se l'immagine è troppo grande e privata a Clarifai viene passata la rappresentazione base64
                            ctx.drawImage(this, 0, 0, canvas.width, canvas.height);
                            result.clariData = canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, '');
                        }

                        // L'immagine viene ridimensionata fino a che non diventa più piccola di 1MB
                        //console.log("Le dimensioni reali sono: " + width + " x " + height);
                        while(size > maxDimension) {
                            //console.log("La dimensione è: " + size + " quindi comprimo");
                            canvas.width = canvas.width * 0.9;
                            canvas.height = canvas.height * 0.9;
                            size = canvas.width * canvas.height * 24;
                            ctx.drawImage(this, 0, 0, canvas.width, canvas.height);
                            //console.log("La nuova dimensione è: " + size);
                        }

                        //console.log("Le dimensioni finali sono: " + canvas.width + " x " + canvas.height);

                        var ocrData = canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, '');

                        $("body").append(ocrData);

                        // In questo caso all'OCR viene sempre passata l'immagine in formato base64
                        result.clariURL = public;
                        result.ocrData = ocrData;
                        result.ocrURL = false;

                        callback(result);
                    };
                    image.src = url;
                    //console.log("L'url è: " + url);

                } else {

                    //console.log("Image size below 1MB");

                    image.onload = function () {
                        // Costruisco un oggetto contente le info necessarie al labeling
                        var result = {};

                        if (public) {
                            // Se l'immagine è delle dimensioni giuste e pubblica basta passare l'URL ai servizi
                            result.clariData = url;
                            result.clariURL = true;
                            result.ocrData = url;
                            result.ocrURL = true;

                        } else {
                            // Se l'immagine è delle dimensioni giuste e privata occorre passare l'immagine in formato base64
                            var canvas = document.createElement('canvas');
                            var height = this.naturalHeight;
                            var width = this.naturalWidth;
                            var size = xhr.getResponseHeader('Content-Length') * 8;
                            var pesoPerPixel = size / (width*height);
                            //console.log("Le dimensioni reali sono: " + width + " x " + height);
                            canvas.height = height;
                            canvas.width = width;
                            var ctx = canvas.getContext("2d");
                            ctx.drawImage(this, 0, 0, width, height);
                            var b64data = canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, '');

                            result.clariData = b64data;
                            result.clariURL = false;
                            result.ocrData = b64data;
                            result.ocrURL = false;
                        }

                        callback(result);
                    };
                    image.src = url;
                    //console.log("L'url è: " + url);
                }
            } else {
                switch(navigator.language) {
                    case 'en':
                        notify('ImageDetection', "Error uploading the image. Unsupported format.");
                        break;
                    case 'it':
                        notify("ImageDetection", "Errore durante il caricamento dell'immagine. Formato non supportato.");
                        break;
                    case 'es':
                        notify("ImageDetection", "Error al cargar de la imagen. Formato no compatible.");
                        break;
                    default:
                        notify("ImageDetection", "Error uploading the image. Unsupported format.");
                }
            }
        }
    };
    xhr.send(null);
};

// Funzione per notificare un messaggio all'utente
var notify = function (title, message) {
    chrome.notifications.create('', {
        'type': 'basic',
        'iconUrl': 'icons/icon128.png',
        'title': title,
        'message': message || ''
    }, function (nid) {
        // La notifica viene chiusa automaticamente in 4 secondi
        window.setTimeout(function () {
            chrome.notifications.clear(nid);
        }, 4000);
    });
};

// Funzione che verifica la presenza delle credenziali per Clarifai
var checkClarifaiAPI = function() {
    if( !API_KEY ) {
        switch(navigator.language) {
            case 'en':
                notify("ImageReader", "Your Clarifai API key is not inserted, please check it in the options.");
                break;
            case 'it':
                notify("ImageReader", "La tua API key di Clarifai non è inserita, per favore controllala nelle opzioni.");
                break;
            case 'es':
                notify("ImageReader", "Tu API key de Clarifai no esta insertada, por favor verificála en las opciones.");
                break;
            case 'de':
                notify("ImageReader", "Ihr Clarifai API key ist nicht eingefügt, bitte überprüfen Sie es in den Optionen.");
                break;
            default:
                notify("ImageReader", "Your Clarifai API key is not inserted, please check it in the options.");
        }
        return false;
    } else {
        return true;
    }
}

// Funzione che verifica la presenza delle credenziali per OCR.Space
var checkOcrAPI = function() {
    if (OCR && !OCR_API_KEY) {
        switch(navigator.language) {
            case 'en':
                notify("ImageReader", "Your OCR.Space key is not inserted, please check it in the options.");
                break;
            case 'it':
                notify("ImageReader", "La tua OCR.Space key non è inserita, per favore controllala nelle opzioni.");
                break;
            case 'es':
                notify("ImageReader", "Tu OCR.Space key no esta insertada, por favor verificála en las opciones.");
                break;
            case 'de':
                notify("ImageReader", "Ihre OCR.Space key ist nicht eingefügt, bitte überprüfen Sie es in den Optionen.");
                break;
            default:
                notify("ImageReader", "Your OCR.Space key is not inserted, please check it in the options.");
        }
        return false;
    } else {
        return true;
    }
};

// Funzione che notifica all'utente l'esito dell'analisi di un'immagine
var showResponseMessage = function(type, farewell) {
    if(farewell === "Done") {
        switch(navigator.language) {
            case 'en':
                notify(type + "Detection","Request done.");
                break;
            case 'it':
                notify(type + "Detection","Richiesta eseguita.");
                break;
            case 'es':
                notify(type + "Detection","Petición hecha.");
                break;
            case 'de':
                notify(type + "Detection","Anfrage erledigt.");
                break;
            default:
                notify(type + "Detection","Request done.");
        }
    } else {
        switch(navigator.language) {
            case 'en':
                notify(type + "Detection","Can't make the request.");
                break;
            case 'it':
                notify(type + "Detection","Impossibile completare la richiesta.");
                break;
            case 'es':
                notify(type + "Detection","Imposible completar el pedido.");
                break;
            case 'de':
                notify(type + "Detection","Kann die Anfrage nicht stellen.");
                break;
            default:
                notify(type + "Detection","Can't make the request.");
        }
    }
};

// Funzione che costruisce il messaggio con cui viene descritta l'immagine
var composeMessage = function(concepts, language){
    var message;
    var textPresence = false;

    switch(language){
        case 'en':
            message = "The image may contain ";
            break;
        case 'it':
            message = "L'immagine può contenere ";
            break;
        case 'es':
            message = "La imagen puede contener ";
            break;
        case 'de':
            message = "Das Bild könnte enthalen: ";
            break;
        default:
            message = "";
    }

    for (var i = 0; i < MAX_RESULTS && i < concepts.length; i++) {
        if (i > 0) {
            if (i == MAX_RESULTS - 1 || i == concepts.length - 1){

                switch(language) {
                    case 'en':
                        message += " and ";
                        break;
                    case 'it':
                        message += " e ";
                        break;
                    case 'es':
                        message += " y ";
                        break;
                    case 'de':
                        message += " und ";
                        break;
                    default:
                        message += ", ";
                }
            } else {
                message += ", ";
            }
        }

        // "text" è usato sia per DE che per EN
        if (concepts[i].name === "testo" || concepts[i].name === "illustrazione" ||
        concepts[i].name === "text" || concepts[i].name === "illustration" ||
        concepts[i].name === "texto" || concepts[i].name === "ilustración" ||
        concepts[i].name === "abbildung") {

            textPresence = true;
        }

        message += concepts[i].name;
    }

    return {
        message: message,
        textPresence: textPresence
    };
};


// Definizione del menù e del relativo handler
chrome.contextMenus.create({
    title: buttonMessage,
    contexts: ['image'],
    onclick: function (obj, selectedTab) {
            // Verifico che le credenziali per i servizi siano presenti
            if ( !checkClarifaiAPI() ) return;
            if ( !checkOcrAPI() ) return;

            var myInit = { method: 'HEAD', credentials: 'omit', cache: 'default', redirect: 'error' };
            //console.log("Verifing URL");

            // Verifico se l'immagine è pubblica o privata
            fetch(obj.srcUrl, myInit).then(function(response) {
                //console.log("Response: ");
                //console.log(response);
                if(response.ok) {

                    // URL pubblico
                    //console.log("URL found");
                    // Invio con URL
                    getImageData(obj.srcUrl, true, labeling);

                } else {
                    // URL privato
                    //console.log("URL not found");
                    if (PRIVATE)
                        // Invio in formato base64
                        getImageData(obj.srcUrl, false, labeling);
                }
            }).catch(function(err) {
                // Errore: probabilmente perchè è stato tentato un redirect
                //console.log("Redirect attempt detected");
                //console.log("URL not found");
                if (PRIVATE)
                    // Invio in formato base64
                    getImageData(obj.srcUrl, false, labeling);
            });

            function labeling (imgData) {
                // ACCURACY è definito tra 80 e 100
                var accuracy = ACCURACY / 100;

                var clariData;

                //console.log("Sending request to Clarifai");

                // Ottengo le info passate da getImageData
                if (imgData.clariURL) {
                    clariData = imgData.clariData;
                    //console.log("Sending using URL: " + imgData.clariData);
                } else {
                    clariData = { base64: imgData.clariData };
                    //console.log("Sending using base64");
                }

                if (AUTO_LANGUAGE) {
                    // Verifico se la pagina ha un linguaggio impostato
                    chrome.tabs.sendMessage(selectedTab.id, {type: "lang"}, function(response) {
                        if ((response !== undefined && response !== null)  
                            && (response.language !== undefined && response.language !== null && response.language !== "")) {
                            // Se la pagina indica un linguaggio lo utilizzo per il labeling
                            console.log(response);
                            lang = response.language.substring(0,2);

                            if( !(lang === "it" || lang === "en" || lang === "es" || lang === "de") ) {
                                //console.log("Language not supported. Using default language.");
                                lang = LANGUAGE;
                            }
                        } else {
                            // Altrimenti utilizzo il linguaggio di default
                            //console.log("Language not found. Using default language.");
                            lang = LANGUAGE;
                        }
                        body();
                    });
                } else {
                    //console.log("Language detection disabled. Using default language.");
                    lang = LANGUAGE;
                    body();
                }

                function body () {
                    //console.log("Language: " + lang);
                    //console.log("Accuracy: " + accuracy);


                    // clariData conterrà un URL o una sequenza di byte
                    app.models.predict({id: Clarifai.GENERAL_MODEL, language: lang}, clariData).then(
                        function(response) {
                            //console.log("Response: ");
                            //console.log(response);
                            var concepts = response.outputs[0].data.concepts;

                            concepts = concepts.filter(function(item) {
                                return (item.value > accuracy)
                            });

                            msgtxt = composeMessage(concepts, lang);

                            var message = msgtxt.message;
                            var textPresence = msgtxt.textPresence;

                            // Se è presente testo nell'immagine e l'OCR è attivato procedo con 'analisi
                            if(textPresence && OCR) {
                                var formData = new FormData();

                                //console.log("Sending request to OCR.Space");

                                // Ottengo le info passate da getImageData
                                if (imgData.ocrURL) {
                                    //console.log("Sending using URL");
                                    formData.append("url", imgData.ocrData);
                                } else {
                                    //console.log("Sending using base64");
                                    var base64data = "data:image/png;base64," + imgData.ocrData;
                                    formData.append("base64Image", base64data);
                                }

                                formData.append("language", "eng");
                                formData.append("apikey", OCR_API_KEY);
                                formData.append("isOverlayRequired", false);

                                // Richiesta OCR
                                jQuery.ajax({
                                    url: "https://api.ocr.space/parse/image",
                                    data: formData,
                                    dataType: 'json',
                                    cache: false,
                                    contentType: false,
                                    processData: false,
                                    type: 'POST',

                                    // error: function()?
                                    success: function (ocrParsedResult) {
                                        //console.log("OCR request success, response: ");
                                        //console.log(ocrParsedResult);

                                        var parsedResults = ocrParsedResult["ParsedResults"];
                                        var ocrExitCode = ocrParsedResult["OCRExitCode"];
                                        var isErroredOnProcessing = ocrParsedResult["IsErroredOnProcessing"];
                                        var errorMessage = ocrParsedResult["ErrorMessage"];
                                        var errorDetails = ocrParsedResult["ErrorDetails"];

                                        if (parsedResults != null) {

                                            var textParsed = "";
                                            var errorText = "";

                                            // Costruisco il testo iterando sui risultati
                                            $.each(parsedResults, function (index, value) {
                                                var exitCode = value["FileParseExitCode"];
                                                var text = value["ParsedText"];
                                                var errorMessage = value["ParsedTextFileName"];
                                                var errorDetails = value["ErrorDetails"];

                                                if (text !== "")
                                                textParsed += text + " ";

                                                switch (+exitCode) {
                                                    case 0:
                                                    case -10:
                                                    case -20:
                                                    case -30:
                                                    case -99:
                                                    default:
                                                        errorText += "Result" + index + ": " + errorMessage + " ";
                                                        break;
                                                }
                                            });

                                            if (textParsed !== "") {

                                                // Aggiungo al messaggio il testo ottenuto dall'OCR
                                                var textMiddle;
                                                switch(lang) {
                                                    case 'en':
                                                        textMiddle = "\n The text contained in the image is: ";
                                                        break;
                                                    case 'it':
                                                        textMiddle = "\n Il testo contenuto nell'immagine è: ";
                                                        break;
                                                    case 'es':
                                                        textMiddle = "\n El texto contenido en la imagen es: ";
                                                        break;
                                                    case 'de':
                                                        textMiddle = "\n Der Text in dem Bild ist: ";
                                                        break;
                                                    default:
                                                        textMiddle = " \n ";
                                                }

                                                message = message + textMiddle + textParsed;
                                            }
                                        }

                                        //console.log(message);

                                        // Invio la richiesta di modifica dell'alt a content.js
                                        chrome.tabs.sendMessage(selectedTab.id, {src: obj.srcUrl, type: "alt", language: lang, label: message}, function(response) {
                                            //console.log(response.farewell);
                                            showResponseMessage('Text', response.farewell);
                                        });
                                    }
                                });

                            } else {
                                // Non è stato attivato l'OCR
                                //console.log(message);

                                // Invio la richiesta di modifica dell'alt a content.js
                                chrome.tabs.sendMessage(selectedTab.id, {src: obj.srcUrl, type: "alt", language: lang, label: message}, function(response) {
                                    //console.log(response.farewell);
                                    showResponseMessage('Image', response.farewell);
                                });
                            }
                        },
                        // Gestione di errore durante la richiesta a Clarifai
                        function(err) {
                            //console.log('Error sending request to Clarifai: ', err);
                            switch(navigator.language) {
                              case 'en': case 'es': case 'de':
                                  notify('ImageDetection','Error: ' + err.data.status.description);
                                  break;
                              case 'it':
                                  notify("ImageDetection",'Errore: ' + err.data.status.description);
                                  break;
                              case 'es':
                                  notify("ImageDetection",'Error: ' + err.data.status.description);
                                  break;
                              default:
                                  notify("ImageDetection",'Error: ' + err.data.status.description);
                            }
                        }
                    );
                }
            }
        }

    }, function () { //chiusura context.menu.create
        if (chrome.extension.lastError) {
            //console.log('contextMenus.create: ', chrome.extension.lastError.message);
        }
});

// Gestione dell'installazione e aggiornamento dell'estensione
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        // Se installo l'estensione apro la pagina di tutorial
        switch(navigator.language){
            case 'en':
                chrome.tabs.create({ url: "html/start_en.html"});
                break;
            case 'it':
                chrome.tabs.create({ url: "html/start_it.html"});
                break;
            case 'es':
                chrome.tabs.create({ url: "html/start_es.html"});
                break;
            case 'de':
                chrome.tabs.create({ url: "html/start_de.html"});
                break;
            default:
                chrome.tabs.create({ url: "html/start_en.html"});
        }
    } else if(details.reason === "update") {
        // Extension update
    }
});
