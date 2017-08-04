$(function(){
    switch(navigator.language){
        case 'it':
            italianTrans();
            document.getElementsByTagName('html')[0].setAttribute('lang','it');
            break;
        case 'es':
            spanishTrans();
            document.getElementsByTagName('html')[0].setAttribute('lang','es');
            break;    
        case 'de':
            germanTrans();
            document.getElementsByTagName('html')[0].setAttribute('lang','de');
            break;            
    }
});

var italianTrans = function(){
    $("#title").html("<b>Generali</b>");
    $("#checkPrivate").html("Analizza immagini private");
    $("#checkAutolang").html("Ricognizione automatica del linguaggio della pagina");
    $("#defaultLang").html("Linguaggio di default per il <span lang='en'>labeling</span>");
    $("#de").html("Tedesco");
    $("#en").html("Inglese");
    $("#es").html("Spagnolo");
    $("#it").html("Italiano");
    $("#imageTitle").html("<b><span lang='en'>Labeling</span> delle immagini</b>");
    $("#clarifaiKey").html("Inserisci la tua Clarifai key");
    $("#accuracyScroll").html("Soglia d'accuratezza");
    $("#textTitle").html("<b>Ricognizione del testo</b>");
    $("#checkLabel").html("Attiva la <span lang='en'>text recognition</span>");
    $("#textLabel").html("Inserisci la tua <span lang='en'>OCR.Space key</span>");
    $("#save").html("Applica");
    $("#restore").html("Ripristina predefiniti");
}       

var spanishTrans = function(){
    $("#checkPrivate").html("Analiza imagenes privadas");
    $("#checkAutolang").html("Reconocimiento automatico de el idioma de la pagina");
    $("#defaultLang").html("Idioma predeterminado");
    $("#de").html("Alemán");
    $("#en").html("Inglés");
    $("#es").html("Español");
    $("#it").html("Italiano");
    $("#imageTitle").html("<b>Labeling de las imagenes</b>");
    $("#clarifaiKey").html("Inserta tu Clarifai <span lang='en'>key</span>");
    $("#accuracy").html("Umbral de precisión");
    $("#textTitle").html("<b>Reconocimiento de texto</b>");
    $("#checkLabel").html("Activa el reconocimiento del texto");
    $("#textLabel").html("Inserta tu <span lang='en'>OCR.Space key</span>");
    $("#save").html("Aplicar");
    $("#restore").html("Restaura");
}

var germanTrans = function(){
    $("#checkPrivate").html("Analysieren private Bilder.");
    $("#checkAutolang").html("Automatische Seitensprachenerkennung");
    $("#defaultLang").html("Standardkennzeichnungssprache");
    $("#de").html("Deutsche");
    $("#en").html("Englisch");
    $("#es").html("Spanisch");
    $("#it").html("Italienisch");
    $("#imageTitle").html("<b>Bildbeschriftung</b>");
    $("#clarifaiKey").html("Setzen Sie Ihren Clarifai API key");
    $("#accuracyScroll").html("Genauigkeitsschwelle");
    $("#textTitle").html("<b>Texterkennung</b>");
    $("#checkLabel").html("Texterkennung aktivieren");
    $("#textLabel").html("Setzen Sie Ihren <span lang='en'>OCR.space key</span>");
    $("#save").html("Anwenden");
    $("#restore").html("Standardeinstellungen wiederherstellen");
}    