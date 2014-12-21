var currencyList = {
    "$": "1",
    "£": "2",
    "€": "3",
    "pуб": "5",
    "R$": "7",
    "¥": "8",
    "kr": "9",
    "Rp": "10",
    "RM": "11",
    "P": "12",
    "S$": "13",
    "฿": "14",
    "₫": "15",
    "₩": "16",
    "TL": "17",
    "₴": "18",
    "Mex$": "19",
    "C$": "20",
    "A$": "21",
    "NZ$": "22"
};

var timeFormatList = {
    "12h": "12h",
    "24h": "24h"
}

var defaultBg = "http://cdn.steamcommunity.com/economy/image/xJFAJwB220HYP78WfVEW3nzdipZEBtUBDPFsDJm3XnkNmnfcWWqdU3jmo-hbMVhUcciThRFElxkH_HEUmLRffgCeZJxHYo5Rebvv7kJ7RlM7ns3WUUycWwr3MVnT9xsuCJEygx03jFR9-KaxD38bGSSYmodKG81VWaUzWYLqQGwL";

var options = self.options;
var sendMsg = self.postMessage;

var FFOptions = self.options;

//######################################################################
// USER / SETTINGS
//######################################################################


var User = function() {
    this.settings = {
        "currency": 3,
        "currencyIcon": "€",
        "background": "http://cdn.steamcommunity.com/economy/image/xJFAJwB220HYP78WfVEW3nzdipZEBtUBDPFsDJm3XnkNmnfcWWqdU3jmo-hbMVhUcciThRFElxkH_HEUmLRffgCeZJxHYo5Rebvv7kJ7RlM7ns3WUUycWwr3MVnT9xsuCJEygx03jFR9-KaxD38bGSSYmodKG81VWaUzWYLqQGwL",
        "timeFormat": "24h"
    }

    this.bets = {
        'win': null,
        'loss': null,
        'total': null,
        'ratio': null
    };
    if (typeof chrome != "undefined") {
        this.addonVersion = chrome.runtime.getManifest().version;
    } else {
        this.addonVersion = "3.0";
    }
};

User.prototype.getSetting = function(name, def) {
    if (name in this.settings)
        return this.settings[name];
    return (typeof def !== 'undefined' ? def : null);
}

User.prototype.loadSettings = function(callback) {
    var self = this;

    if (typeof chrome == "undefined") {
        if (typeof FFOptions["settings"] !== 'undefined')
            $.extend(self.settings, JSON.parse(FFOptions["settings"]));
        callback(self);
    } else {
        console.log("load settings");
        chrome.storage.local.get("settings", function(data) {
            if (typeof data["settings"] !== 'undefined')
                $.extend(self.settings, JSON.parse(data["settings"]));
            callback(self);
        });
    }
}

User.prototype.setSetting = function(name, value) {
    if (typeof chrome == "undefined") {
        options[name] = value;
        sendMsg(options);
    } else {
        var obj = {};
        obj[name] = value
        chrome.storage.local.set(obj);
    }
}


function reloadDonator() {
    $("#donatorsList").text("Loading ...");
    // Retreive the list of donators and publish it in a table
    $.getJSON("http://loungeassistant.bi.tk/donators.json?" + Math.random() /*avoid caching*/ , function(donators) {
        donators.sort(function(a, b) {
            return b.totalprice - a.totalprice;
        });

        $("#donatorsList").text("");
        $.each(donators, function(idx, donator) {
            $("#donatorsList").append(
                $("<tr>").append(
                    $("<td>").append(
                        $("<a>").attr({
                            "href": donator.link,
                            "target": "_blank"
                        }).text(donator.name)
                    )
                ).append(
                    $("<td>").text(donator.items)
                ).append(
                    $("<td>").text(donator.totalprice + "€")
                )
            );
        });
    });
}


function main(user) {
    $("#version").text(user.addonVersion);

    $(".la-option-validate").click(function(e) {
        var background = $("#la-option-background").val();
        background = background != "" ? background : defaultBg;
        var currency = currencyList[$("#la-currency-list").val()];
        var currencyIcon = $("#la-currency-list").val();
        var timeFormat = timeFormatList[$("#la-time-format").val()];

        var settings = {
            'background': background,
            'currency': currency,
            'currencyIcon': currencyIcon,
            'timeFormat': timeFormat
        };
        console.log("set1");
        user.setSetting('settings', JSON.stringify(settings));
        console.log("set2");

        $("#la-option-msg").text("Saved !").show().fadeOut(3000);
    });

    $.each(currencyList, function(key, value) {
        $("#la-currency-list").append(
            $("<option>").attr(
                user.getSetting("currency") == value ? {
                    'selected': 'selected'
                } : {}
            ).text(key));
    });

    $.each(timeFormatList, function(key, value) {
        $("#la-time-format").append(
            $("<option>").attr(
                user.getSetting("timeFormat") == value ? {
                    'selected': 'selected'
                } : {}
            ).text(key));
    });

    $("#la-option-background").val(user.getSetting("background"));

    $("#la-reload").click(function() {
        reloadDonator();
    });

    reloadDonator();
};


$(document).ready(function() {
    var user = new User();
    user.loadSettings(main);
});
