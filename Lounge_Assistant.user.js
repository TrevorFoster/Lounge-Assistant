// ==UserScript==
// @author      @BitK_
// @description csgolounge Enhancer
// @name        Lounge Assistant
// @namespace   csgolounge.com/*
// @include     http://csgolounge.com/*
// @version     1.8
// @grant       GM_xmlhttpRequest
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_getResourceText
// @resource css https://raw.githubusercontent.com/LoungeAssistant/Lounge-Assistant/master/style.css?1.8
// @require     http://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js

// ==/UserScript==

GM_addStyle(GM_getResourceText("css"));

var bumps_url = [];
var isLogged = $("#logout").length;
var currency = {
    "$"    : "1",
    "£"    : "2",
    "€"    : "3",
    "pуб"  : "5",
    "R$"   : "7",
    "¥"    : "8",
    "kr"   : "9",
    "Rp"   : "10",
    "RM"   : "11",
    "P"    : "12",
    "S$"   : "13",
    "฿"    : "14",
    "₫"    : "15",
    "₩"    : "16",
    "TL"   : "17",
    "₴"    : "18",
    "Mex$" : "19",
    "C$"   : "20",
    "A$"   : "21",
    "NZ$"  : "22"
}
var colors = {
    "Base"          : "#B0C3D9",
    "Consumer"      : "#B0C3D9",
    "Mil-Spec"      : "#4B69FF",
    "Industrial"    : "#5E98D9",
    "Hight"         : "#4B69FF",
    "Restricted"    : "#8847FF",
    "Remarkable"    : "#8847FF",
    "Classified"    : "#D32CE6",
    "Covert"        : "#EB4B4B",
    "Exotic"        : "#D32CE6",
    "Extraordinary" : "#000000",
    "Contraband"    : "#E4AE39",
};

var PriceList = {};

//######################################################################
// ITEMS
//######################################################################

function addJs(func)
{
    var script = document.createElement('script');
    script.setAttribute("type", "application/javascript");
    script.textContent = func;
    document.body.appendChild(script);
}

function getPrice(name, context, callback)
{
    var ctx = {"context" : context, "callback" : callback};
    GM_xmlhttpRequest({
	context: ctx,
	method: "GET",
	url: "http://steamcommunity.com/market/priceoverview/?currency="+ GM_getValue("currency", 0) +"&appid=730&market_hash_name=" + name,
	onload: function(response){
	    var callback = response.context.callback;
	    var context = response.context.context;
	    var json = JSON.parse(response.responseText);
	    var price = "Not found";
	    if (json.success){
		if (typeof json.lowest_price != 'undefined')
		    price = json.lowest_price;
		else if (typeof json.median_price != 'undefined')
		    price = json.median_price;
	    }
	    callback(price, context);
	}
    });
}

function UpdateItem(){
    $.each($(".item"), function (idx, data){
	var rarityDiv = $(data).find(".rarity");
	var rarity = rarityDiv.attr('class').replace("rarity ", "");
	var itemName = $(data).find(".smallimg").attr("alt");

	if (itemName.match("(^.*Any .*$)|(^\\s+Knife\\s+$)"))
	{
	    $(data).find(".rarity").css({
		"visibility" : "hidden",
	    });
	    return 1;
	}
	if (rarity in colors) {
	    $(data).find(".rarity").css({
		"background-color" : colors[rarity],
	    });
	}
    });

    $("div.item").unbind("mouseenter");
    $("div.item").bind("mouseenter", function(evt){

	if ($(this).hasClass("priced"))
	    return;

	var itemName = $(this).find(".smallimg").first().attr("alt");

	if (itemName in PriceList) {
	    $(this).find(".rarity").html(PriceList[itemName]);
	    return;
	}
	$(this).find(".rarity").html("Loading ...");
	var context = {'PriceList' : PriceList, 'item' : $(this), 'itemName' : itemName};
	getPrice(itemName, context, function(price, context) {
	    context.PriceList[context.itemName] = price;
	    context.item.find(".rarity").html(price);
	    context.item.addClass("priced");
	});
    });

    observer.disconnect();
    $(".item.Star:not(:has(>.clreff))").prepend($("<div>").attr({
    	"class": "clreff",
    	"style" : "background-color: #8650AC"
    	}).text("★"));
    startObserver();

    $(".rarity" ).unbind("click");
    $(".rarity" ).click(function() {
	var newSrc = $(this).parent().find("img").attr("src").replace("99fx66f", "512fx388f");
	var newLink = $(this).parent().find("a")[1].href;
	$("#modalImg").attr("src", newSrc);
	$("#modalMarket").attr("href", newLink);
	$("#modalPreview").fadeIn("fast");
    });
}


var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function( mutation ) {
        var newNodes = mutation.addedNodes;
	if(newNodes !== null && newNodes.length > 0) {
	    $.each(newNodes, function(idx, n){
		if (n.nodeName != "#text"){
		    UpdateItem();
		    return false;
		}
	    });
	}
    });
});

function startObserver()
{
    observer.observe(document.body, {
	childList: true,
	subtree : true,
	characterData: true
    });
}

$(document).ready(function(){
    UpdateItem();
    startObserver();
});


function setBackground()
{
    var background = GM_getValue("background", "");
    if (background != "")
	$("body").css("background-image", "url(" + background + ") ");
    else
	$("body").css("background-image", "url(http://cdn.steamcommunity.com/economy/image/xJFAJwB220HYP78WfVEW3nzdipZEBtUBDPFsDJm3XnkNmnfcWWqdU3jmo-hbMVhUcciThRFElxkH_HEUmLRffgCeZJxHYo5Rebvv7kJ7RlM7ns3WUUycWwr3MVnT9xsuCJEygx03jFR9-KaxD38bGSSYmodKG81VWaUzWYLqQGwL)");
}

function addMenu(){
    $("#submenu>div").first()
	.append($('<div>').attr({'id' : 'la-menu'})
		.append($('<a>').attr({'href' : 'https://github.com/LoungeAssistant/Lounge-Assistant/raw/master/Lounge_Assistant.user.js', 'class' : 'menuAssistant update'}).html("<b>Lounge Assistant</b> " + GM_info.script.version))
		.append($("<a>").html("Website").attr({"href": "http://loungeassistant.github.io/Lounge-Assistant/"}))
		.append($("<a>").html("Group").attr({"href": "http://steamcommunity.com/groups/LoungeAssistant"}))
		.append($("<a>").html("Contributors").attr({"class": "showContributor"}))
		.append($("<a>").html("Donate to LoungeAssistant ♥").attr({"href" : "http://steamcommunity.com/tradeoffer/new/?partner=79084932&token=3tOAL0yn"}))
		.append($("<a>").html("Trades : Not logged in").attr({"id" : "la-trade", "title" : "Bump all"}))
		.append($("<a>").html("Won : Not logged in").attr("id", "la-winloose"))
		.append($("<a>").html("Options").attr({"class": "la-option"}))
	       );


    $(".showContributor").click(function(){showContributor()});

    $(".la-option").click(function(){
	$("#la-modal-option").slideDown('fast');
	GM_xmlhttpRequest({
	    context: document.body,
	    method: "GET",
	    url: "https://github.com/LoungeAssistant/Lounge-Assistant/raw/master/Lounge_Assistant.user.js",
	    onload: function(response) {
		var document = response.context
		var newVersion = response.responseText.match('^// @version\\s+(.*)$', "m");
		if (newVersion[1] != GM_info.script.version)
		{
		    $(document).find(".la-option-version")
			.append($("<a>").attr(
			    {
				"href": "https://github.com/LoungeAssistant/Lounge-Assistant/raw/master/Lounge_Assistant.user.js",
				"style" : "color:red"
			    }).text(" Update to " + newVersion[1]));
 		}
	    }
	});
    });
}

function addModal(){
    $("body").append(
	$("<div>").attr(
	    {
		"id" : "modalAssistant"
	    }
	).append(
	    $("<a>").attr(
		{
		    "class" : "buttonright",
		    "onclick" : "$(this).parent().fadeOut('fast')"
		}
	    ).html("  X ")
	).append(
	    $("<div>").attr(
		{
		    "id" : "modalCnt"
		}
	    )
	)
    );
    $("body").append(
	$("<div>").attr(
	    {
		"id" : "la-modal-option"
	    }
	).append(
	    $("<a>").attr(
		{
		    "class" : "buttonright",
		    "onclick" : "$(this).parent().fadeOut('fast')"
		}
	    ).html("  X ")
	).append(
	    $("<div>").attr(
		{
		    "id" : "la-modal-option-cnt"
		}
	    ).append(
		$("<h2>").text("Options")
	    ).append(
		$("<div>").attr("class", "la-option-entry").append(
		    $("<label>").text("Background :")
		).append(
		    $("<input>").attr(
			{"class" : "la-option-background",
			"placeholder" : "url",
			 "value" : GM_getValue("background", "")
			})
		)
	    ).append(
		$("<div>").attr("class", "la-option-entry").append(
		    $("<label>").text("Currency :")
		).append(
		    $("<select>").attr("class", "la-currency-list")
		)
	    ).append(
		$("<div>").attr("class", "la-option-entry la-option-version").append(
		    $("<label>").text("Version :")
		).append(
		    $("<a>").attr("href", "https://github.com/LoungeAssistant/Lounge-Assistant/raw/master/Lounge_Assistant.user.js").text(GM_info.script.version)
		)
	    ).append(
		$("<button>").text("OK").attr("class", "buttonright la-option-validate")
	    )
	)
    );


    $.each(currency, function (key, value){
	var current = GM_getValue("currency", 0);
	$(".la-currency-list").append($("<option>").attr(current == value ? {'selected' : 'selected'} : {}).html(key));
    });

    $(".la-option-validate").click(function(){
	GM_setValue("currency", currency[$('.la-currency-list').val()]);

	PriceList = {};
	$(".priced").removeClass("priced");
	GM_setValue("background", $(".la-option-background").val());
	setBackground();
	$("#la-modal-option").fadeOut('fast');
    });

    $("#modalPreview").append($("<a>").attr({'id' : 'modalMarket', 'href' : '#'}).text('Market'));
};

function isUpToDate(){
    var date = Date.now();
    var lastCheck = GM_getValue('lastCheck', 0);

    if (date - lastCheck > 3600 * 1000)
	{
	    GM_xmlhttpRequest({
		context: document.body,
		method: "GET",
		url: "https://github.com/LoungeAssistant/Lounge-Assistant/raw/master/Lounge_Assistant.user.js",
		onload: function(response) {
		    var document = response.context
		    var newVersion = response.responseText.match('^// @version\\s+(.*)$', "m");
		    if (newVersion[1] != GM_info.script.version)
			{
			    $(document).find(".update")
				.html(" ⚠ Install Latest Version ⚠ ").attr(
				    {
					"href": "https://github.com/LoungeAssistant/Lounge-Assistant/raw/master/Lounge_Assistant.user.js",
					"style" : "color:red"
				    });
 			}
		}
	    });
	    GM_setValue('lastCheck', date);
	}
}

function showContributor() {
    $("#modalCnt").html('<img src="../img/load.gif" id="loading" style="margin: 0.75em 2%">');
    GM_xmlhttpRequest({
	context: document.body,
	method: "GET",
	url: "http://loungeassistant.bi.tk/contributors.html",
	onload: function(response) {
            var document = response.context
	    $(document).find("#modalCnt").html(response.responseText);
	}
    });
    $("#modalAssistant").slideDown('fast');
}


function displayBotStatus(){
    $.get("/status", function(data){
	var status = $(data).find("tr").eq(1).find("td");
	var msg = "Bots status "
	var src = "";

	$.each(status, function(idx, status){
	    switch ($(status).attr("bgcolor"))
	    {
	    case '#76EE00':
		src = "http://loungeassistant.bi.tk/online.svg?" + GM_info.script.version;
		break;
	    case '#FFA500':
		src = "http://loungeassistant.bi.tk/unstable.svg?" + GM_info.script.version;
		break;
	    case '#FF0000':
	    default:
		src = "http://loungeassistant.bi.tk/offline.svg?" + GM_info.script.version;
		break;
	    }
	    msg += '<abbr class="la-bot-status" title="'+ $(status).text()+'"><img class="botstatus" src="' + src + '"></a>';
	});
	$("#submenu>div>a").eq(isLogged + 4).html(msg);
    });

}

function displayBetHistory(clearMain)
{
    clearMain = typeof clearMain !== 'undefined' ? clearMain : false;

    $.get("/ajax/betHistory.php", function(data){
	if (clearMain)
	    $("#main").html($("<section>").attr("class", "box boxhistory").html(data));
	else
	    $("#main").append($("<section>").attr("class", "box boxhistory").html(data));

    });
}

function winLoss()
{
    $("#la-winloose").text("Loading ...");
    $.get("/ajax/betHistory.php", function(data){
    	var won = $(data).find(".won").length;
    	var lost = $(data).find(".lost").length;
	var total = won + lost;
	var winPercent = Math.floor(won / total * 100);
	var winclass = "";
	if (total == 0){
	    $("#la-winloose").attr('class', winclass).html("Won : no bet found");
	    return;
	}
	if (winPercent < 50) winclass = "loosing";
	else if (winPercent > 50) winclass = "winning";
	$("#la-winloose").attr('class', winclass).html("Won : <b>" + winPercent+ "%</b> ("+ won+" / "+ total+")");
    });

    $("#la-winloose").click(function(){
	displayBetHistory(true);
    })
}


function updateTrade()
{
    $("#la-trade").text("Loading ...");

    $.get("/mytrades", function(data){
	var tradesnb = $(data).find(".tradeheader").length;

	$.each($(data).find(".tradeheader>.buttonright"), function (idx, item){
	    bumps_url.push($(item).attr("onclick").match(/\d+/)[0]);
	});
	$("#la-trade").text(tradesnb + " trade" + (tradesnb > 1 ? 's' : '') + '  / Bump ' + bumps_url.length);

	var newtrade = 0;
	$.each($(data).find(".tradeheader>.notification"), function(idx, data){
	    newtrade += parseInt($(data).text().match(/^\d+/)[0]);
	});
	if (newtrade)
	    $("#menu>li").eq(1).append($("<div>").attr({'class': 'notification'}).text(newtrade));
    });


}

function trade()
{
    updateTrade();

    $("#la-trade").click(function(){
	$.each(bumps_url, function(idx, trade){
	    $.ajax({
	        type: "POST",
		url: "ajax/bumpTrade.php",
		data: "trade=" + trade
	    });
	});

	bumps_url = [];
	updateTrade();
    });
}

function replaceAlert() {
    addJs('function alert(msg){$("#submitmsg").html(msg).show().delay(5000).fadeOut(4000);}');
}

function trySubmit()
{
    replaceAlert();
    if ($("#autoplace").is(":checked"))
	{
	    location.assign("javascript:" + $("#placebut").attr("onclick").split(";")[1]);
	    window.setTimeout(trySubmit, 10000);
	}
}

function addAutoSubmit(){
    var button = $("#placebut");
    if (button.length)
	{
	    button.after(
		$("<label>").attr("class", "autoplace").text("Auto Submit ")
		    .append($("<input>").attr({"type" : "checkbox", "id" : "autoplace"}))
		    .append($("<div>").attr("id", "submitmsg")));

	    $("#autoplace").on("change", function(){
		trySubmit();
	    });
	}
}

function addInventoryLink(){
    if ($(".profilesmallheader>a").length < 1 || !isLogged)
	return;
    var steamid = $(".profilesmallheader>a").attr("href").match(/\d+/)[0];
    $(".profilesmallheader").append($("<a>").attr("href", "http://steamcommunity.com/profiles/" + steamid + "/inventory").text("Inventory"));
}

function addMinimizeButton(){
    $("#bets").prepend(
	$("<a>").attr({"class" : "la-maximize-all"}).text("+")
    );
    $("#bets").prepend(
	$("<a>").attr({"class" : "la-minimize-all"}).text("-")
    );

    $(".matchheader>.whenm:first-child").prepend(
	$("<a>").attr({"class" : "la-minimize-match"}).text("-")
    );

    $(".matchheader>.whenm:first-child").append($("<br><div>").attr({"class" : "la-match-info"}).hide());

    $(".la-minimize-match").click(function(){
	$(this).text($(this).text() == "+" ? "-" : "+");
	var matchmain = $(this).parents(".matchmain");
	var teams = [{"name" : matchmain.find(".teamtext>b").eq(0).text(),
		      "rate" : matchmain.find(".teamtext>i").eq(0).text()},
		     {"name" : matchmain.find(".teamtext>b").eq(1).text(),
		      "rate" : matchmain.find(".teamtext>i").eq(1).text()}
		    ];

	matchmain.find(".la-match-info").html("<b>" + teams[0].name + "</b> <i>" + teams[0].rate + "</i><span class='la-vs'> vs </span><b>" + teams[1].name + "</b><i> " + teams[1].rate + "</i>");
	if ($(this).text() == "+"){
	    matchmain.find(".match").fadeOut(400, "swing", function(){
		matchmain.find(".la-match-info").fadeIn();
	    });
	}
	else{
	    matchmain.find(".la-match-info").fadeOut(400, "swing", function(){
		matchmain.find(".match").fadeIn();
	    });
	}
    });

    $(".la-minimize-all").click(function(){
	$.each($(".la-minimize-match"), function(idx, content){
	    if ($(content).text() == "-")
		setTimeout(function(){$(content).click()}, idx*100)
	})
    });
    $(".la-maximize-all").click(function(){
	$.each($(".la-minimize-match"), function(idx, content){
	    if ($(content).text() == "+")
		setTimeout(function(){$(content).click()}, idx*100)
	})
    });
}


setBackground();
addModal();
addMenu();
addInventoryLink();
displayBotStatus();
isUpToDate();
addAutoSubmit();
if (isLogged)
    {
	winLoss();
	trade();
    }

addMinimizeButton();

if (window.location.href.match(/mybets$/))
    displayBetHistory();

$(".match").on('mouseenter', function (){
    var elem = $(this);
    var matchurl = elem.find("a").first().attr("href");
    $(elem.find(".matchleft>a>div")[1]).attr({"class" : "la-bof"}).html('-');

    $.get(matchurl, function(data){
    	var bof = $($(data).find(".half")[1]).html();
	$(elem.find(".matchleft>a>div")[1]).attr({"class" : "la-bof"}).html(bof);
	elem.unbind('mouseenter');
    });

});



$("#la-modal-option-cnt").html("<h2>Big Update</h2><h5>Version 2.0</h5><br><p style='color:white'>Lounge Assistant is now a \"real\" add-on.<br>Check the <a href='http://loungeassistant.github.io/Lounge-Assistant/' style='color:#FF8A00'>Add-on Webpage</a> to get the new version !</p>");
$("#la-modal-option").slideDown('fast');
