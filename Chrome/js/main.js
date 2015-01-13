var bumps_url = [];
var isLogged = $("#logout").length;

var BASEURL = window.location.protocol + "//" + window.location.host + "/"; // are we on csgolounge or dota2lounge
var APPID = BASEURL.match(/csgo/) ? 730 : 570; // 730 = csgo; 570 = dota2


/* Firefox support */
var FFOptions = self.options;
/**/


//######################################################################
// USER / SETTINGS
//######################################################################


var User = function() {
    this.settings = {
        "currency": 1,
        "currencyIcon": "$",
        "background": "http://cdn.steamcommunity.com/economy/image/xJFAJwB220HYP78WfVEW3nzdipZEBtUBDPFsDJm3XnkNmnfcWWqdU3jmo-hbMVhUcciThRFElxkH_HEUmLRffgCeZJxHYo5Rebvv7kJ7RlM7ns3WUUycWwr3MVnT9xsuCJEygx03jFR9-KaxD38bGSSYmodKG81VWaUzWYLqQGwL",
        "timeFormat": "12h"
    }

    this.bets = {
        'win': null,
        'loss': null,
        'total': null,
        'ratio': null
    };
};

User.prototype.getSetting = function(name, def) {
    if (name in this.settings)
        return this.settings[name];
    return (typeof def !== 'undefined' ? def : null);
}

/* local storage abstraction for chrome / firefox */
User.prototype.loadSettings = function(callback) {
    var self = this;

    if (typeof chrome == "undefined") { /* Firefox */
        if (typeof FFOptions["settings"] !== 'undefined')
            $.extend(self.settings, JSON.parse(FFOptions["settings"]));
        callback(self);
    } else { /* Chrome */
        chrome.storage.local.get("settings", function(data) {
            if (typeof data["settings"] !== 'undefined')
                $.extend(self.settings, JSON.parse(data["settings"]));
            callback(self);
        });
    }
}


//######################################################################
// BasePage
//######################################################################

var BasePage = function(user) {
    this.user = user;
    this.path = window.location.pathname;
}


BasePage.prototype.getPage = function() {
    switch (this.path) {
        case "/match":
            return new MatchPage(this.user);
            break;
        case "/profile":
        case "/trade":
            return new TradePage(this.user);
            break;
        case "/myprofile":
            return new ProfilePage(this.user);
            break;
        case "/mybets":
            return new BetsPage(this.user);
            break;
        case "/":
            return new MainPage(this.user);
            break;
        default:
            return new BasePage(this.user);
            break;
    }
}


BasePage.prototype.addMenu = function() {
    $("#submenu").prepend($("<div>").attr("class", "la-hide-div").append($("<span>").attr("class", "la-hide-menu").text("<\n<")));
    $("#submenu>nav").eq(0)
        .append($("<a>").text("Trades : Not logged in").attr({
            "id": "la-trade",
            "title": "Bump all"
        }))
        .append($("<a>").text("Won : Not logged in").attr("id", "la-winloose"))
        .append($("<a>").text("Infinite trade list").attr("href", "/trades"));

    $(".la-hide-div").click(function() {
        $("#submenu").toggleClass("la-display-menu");
        $("#main, main").toggleClass("la-display-menu");
    });
}
BasePage.prototype.displayBetHistory = function() {
    $.get(BASEURL + "/ajax/betHistory.php", function(data) {
        $("main").html($("<section>").attr({
            "style": "margin-left: 40px;",
            "class": "box boxhistory"
        }).html(data)); // retreive the user bet history from profile page and publish it in the current page
    });
}


BasePage.prototype.setBackground = function(img) {
    document.body.style.cssText = "background-image: url(" + img + ") !important; background-attachment: fixed; background-repeat: no-repeat;";
}

BasePage.prototype.updateWinLoss = function() {
    var self = this;

    $("#la-winloose").text("Loading ...");
    $.get(BASEURL + "/ajax/betHistory.php", function(data) {
        var won = $(data).find(".won").length;
        var lost = $(data).find(".lost").length;
        var total = won + lost;
        var winPercent = Math.floor(won / total * 100);
        var winclass = "";
        if (total == 0) {
            $("#la-winloose").attr('class', winclass).text("Won : no bet found");
            return;
        }
        if (winPercent < 50) winclass = "loosing";
        else if (winPercent > 50) winclass = "winning";
        $("#la-winloose").attr('class', winclass).text("Won : ")
            .append($("<b>").text(winPercent + "%"))
            .append(" " + won + " / " + total);
    });

    $("#la-winloose").click(function() {
        self.displayBetHistory();
    })
};


BasePage.prototype.updateBotStatus = function() {
    $.get(BASEURL + "/status", function(data) {
        var status = $(data).find("tr").eq(1).find("td");
        var msg = "Bots status "
        var src = "";

        $.each(status, function(idx, status) {
            switch ($(status).attr("bgcolor")) {
                case '#76EE00':
                    src = "/img/online.svg";
                    break;
                case '#FFA500':
                    src = "/img/unstable.svg";
                    break;
                case '#FF0000':
                default:
                    src = "/img/offline.svg";
                    break;
            }
            msg += '<abbr class="la-bot-status" title="' + $(status).text() + '"><img class="botstatus" src="' + src + '"></a>';
        });
        $("#submenu>div>a").eq(isLogged + 4).html(msg); // publish the img list generated above
    });
}

BasePage.prototype.updateItems = function() {
    var self = this;
    $.each($(".item"), function(idx, data) {
        var item = new Item($(data));
        item.updateRarity();
    });


    $(document).unbind("mouseenter");
    $(document).on("mouseenter", ".item", function() {
        var item = new Item($(this));
        item.updatePrice();
    });
}

BasePage.prototype._init = function() {
    this.addMenu();
    this.setBackground(this.user.getSetting("background"));
    this.updateItems();
    this.updateBotStatus();
    this.updateWinLoss();
}

BasePage.prototype.init = function() {
    this._init();
}


//######################################################################
// MainPage
//######################################################################

var MainPage = function(user) {
    this.user = user;
};


MainPage.prototype = new BasePage();
MainPage.prototype.constructor = MainPage;

MainPage.prototype.addMinimizeButton = function() {
    $("#bets").prepend($("<a>").attr({
        "class": "la-maximize-all"
    }).text("+"));
    $("#bets").prepend($("<a>").attr({
        "class": "la-minimize-all"
    }).text("-"));

    $(".la-minimize-all").click(function() {
        $.each($(".matchmain"), function(idx, content) {
            window.setTimeout(function() {
                var match = new Match($(content));
                match.minimize();
            }, idx * 50);
        });
    });
    $(".la-maximize-all").click(function() {
        $.each($(".matchmain"), function(idx, content) {
            window.setTimeout(function() {
                var match = new Match($(content));
                match.maximize();
            }, idx * 50);
        });
    });
}


MainPage.prototype.init = function() {
    this._init();
    this.addMinimizeButton();

    $.each($(".matchmain"), function(idx, data) {
        var match = new Match($(data));
        match.load();
    });

    $(".matchmain").on("mouseenter", function() {
        var match = new Match($(this));
        match.update();
    });

}

//######################################################################
// BetsPage
//######################################################################

var BetsPage = function(user) {
    this.user = user;
};

BetsPage.prototype = new BasePage();
BetsPage.prototype.constructor = BetsPage;

BetsPage.prototype.init = function() {
    this._init();

    $(".matchmain").each(function() {
        $(".match span:eq(0)", $(this)).prepend("<div class='team' style='margin-left:auto;margin-right:auto;background: url(\"http://cdn.csgolounge.com/img/teams/" + $(".match span:eq(0) b", $(this)).text() + ".jpg\");'>");
        $(".match span:eq(2)", $(this)).prepend("<div class='team' style='margin-left:auto;margin-right:auto;background: url(\"http://cdn.csgolounge.com/img/teams/" + $(".match span:eq(2) b", $(this)).text() + ".jpg\");'>")
    });
}

//######################################################################
// MatchPage
//######################################################################


var MatchPage = function(user) {
    this.user = user;
};


MatchPage.prototype = new BasePage();
MatchPage.prototype.constructor = MatchPage;


MatchPage.prototype.addTime = function() {
    var dt = new Date();
    var tzOffset = (dt.getTimezoneOffset() / 60) + 2;
    var timeDiv = $(".box-shiny-alt .half").eq(2);
    console.log(timeDiv.text());
    var CEST = timeDiv.text();
    var AMorPM = "";

    hour = (CEST.match(/(\d{2}):(\d{2})/)[1] - tzOffset) % 24;
    minute = CEST.match(/(\d{2}):(\d{2})/)[2];

    if (hour < 0) hour = 24 + hour;
    if (user.getSetting("timeFormat") == "12h")
        if (hour == 12) {
            AMorPM = " PM";
        } else if (hour > 12) {
        hour = hour - 12;
        AMorPM = " PM";
    } else {
        AMorPM = " AM";
    }

    hour = hour < 10 ? "0" + hour : hour;
    timeDiv.text(" " + hour + ":" + minute + AMorPM + " Local / " + timeDiv.text());
}

MatchPage.prototype.showMsg = function(msg) {
    $("#la-submitmsg").text(msg).show().delay(5000).fadeOut(4000);
}

MatchPage.prototype.placeNewBet = function(match, tlss) {
    var self = this
    if (!$('#on').val()) {
        self.showMsg("You didn't select a team.");
        return;
    }
    if ($('.left').children().size() > 0) {
        $.ajax({
            type: "POST",
            url: "ajax/postBet.php",
            data: $("#betpoll").serialize() + "&match=" + match + "&tlss=" + tlss,
            success: function(data) {
                if (data) {
                    self.showMsg(data);
                } else {
                    window.location.href = "/mybets";
                }
            }
        });
    } else {
        self.showMsg("You didn't pick any items.");
    }
}

MatchPage.prototype.addItemsBet = function(match, tlss) {
    var self = this;
    if ($('.left').children().size() > 0) {
        $.ajax({
            type: "POST",
            url: "ajax/addItemsBet.php",
            data: $("#betpoll").serialize() + "&match=" + match + "&tlss=" + tlss,
            success: function(data) {
                if (data) {
                    $("#placebut").show();
                    self.showMsg(data);
                } else {
                    window.location.href = "/mybets";
                }
            }
        });
    }

}

MatchPage.prototype.trySubmit = function() {
    if ($("#autoplace").is(":checked")) {
        var match = $("#placebut").attr("onclick").match(/(placeBetNew|addItemsBet)\('(\d+)', '([a-f0-9]{32})'\)/);
        if (match[1] == "placeBetNew") {
            var matchid = match[2];
            var tlss = match[3];
            this.placeNewBet(matchid, tlss);
        } else {
            var matchid = match[2];
            var tlss = match[3];
            this.addItemsBet(matchid, tlss);
        }
        window.setTimeout(this.trySubmit, 10000);
    }
};

MatchPage.prototype.addAutoSubmit = function() {
    var self = this;
    var button = $("#placebut");
    if (button.length) {
        button.after(
            $("<label>").attr("class", "autoplace").text("Auto Submit ")
            .append($("<input>").attr({
                "type": "checkbox",
                "id": "autoplace"
            }))
            .append($("<div>").attr("id", "la-submitmsg")));
        $("#autoplace").on("change", function() {
            self.trySubmit();
        });
    }
}

MatchPage.prototype.updateAllValue = function() {
    var totalValue = 0.0;

    var itemsCount = {
        'Covert': 0.0,
        'Classified': 0.0,
        'Restricted': 0.0,
        'Mil-Spec': 0.0,
        'Industrial': 0.0,
        'Consumer': 0.0,
        'Other': 0.0
    };

    if ($("#backpack").length && $(".la-total-value-div").length == 0) {
        $("#backpack > .oitm > .item").each(function() {
            var type = $(this).children("div.rarity")[0].classList[1];
            var value = parseFloat($(this).children("div.value")[0].innerHTML.replace("$ ", ""));

            if (type in itemsCount)
                itemsCount[type] += value;
            else
                itemsCount['Other'] += value;
            totalValue += value;
        });

        var totalValue = totalValue.toFixed(2);
        var small = (.05 * totalValue).toFixed(2);
        var medium = (.1 * totalValue).toFixed(2);
        var large = (.2 * totalValue).toFixed(2);

        $(".bpheader").after(
            $("<div>").attr("class", "la-total-value-div")
            .append($("<div>").attr("class", "la-total-value").text("Your items are worth: $")
                .append($("<strong>")).append(totalValue))
            .append($("<table>").attr("class", "la-total-value-items"))
            .append($("<table>").attr("class", "la-total-value-betsize")
                .append($("<tr>")
                    .append($("<td>").text("Small bet : $" + small))
                    .append($("<td>").text("Medium bet : $" + medium))
                    .append($("<td>").text("Large bet : $" + large))
                )
            )
        );

        var idx = 0;
        $.each(itemsCount, function(key, value) {
            if (idx % 2 == 0) $(".la-total-value-items").append($("<tr>"));

            $(".la-total-value-items tr:last-child").append($("<td>").append(
                $("<b>").css("color", colors[key]).text(key)
            ).append(" : $" + value.toFixed(2)));

            idx++;
        });
    }
};

MatchPage.prototype.init = function() {
    this._init();
    this.addTime();
    this.addAutoSubmit();
    $("#placebut").after($("<a>").text("All Value").attr("class", "buttonright la-value-button"));
    $(".la-value-button").click(this.updateAllValue);
}

//######################################################################
// ProfilePage
//######################################################################

var ProfilePage = function(user) {
    this.user = user;
}

ProfilePage.prototype = new BasePage();
ProfilePage.prototype.constructor = ProfilePage;

ProfilePage.prototype.addTotals = function() {
    var winTot = 0.0,
        lossTot = 0.0,
        betTot = 0.0;

    var profile = $("#profile .box-shiny-alt div:eq(0)");
    profile.append("Won: <span id='winnings' style='color:green'></span><br>Lost: <span id='losses' style='color:red'></span><br>Total placed: <span id='placed'></span><br>");

    var icon = user.getSetting("currencyIcon");
    var decsep = ".",
        thousep = ",";

    if (icon === "€") {
        decsep = ",";
        thousep = "."
    }

    $.get(BASEURL + "/ajax/betHistory.php", function(data) {
        $(data).find("tr:not([class^='details'])").each(function() {
            var won = $(this).find(".won").length > 0;

            $(this).next().find(".item").each(function() {
                getPrice(new Item($(this)), function(price) {
                    if (!price) return;
                    price = price.replace(/\&\#?.+;/g, "");

                    var real = accounting.unformat(price, decsep);

                    betTot += real;
                    if (!won) {
                        lossTot += real;
                    }
                    profile.find("#losses").html(accounting.formatMoney(lossTot, icon, 2, thousep, decsep));
                    profile.find("#placed").html(accounting.formatMoney(betTot, icon, 2, thousep, decsep));
                });
            });

            if (won) {
                $(this).next().next().find(".item").each(function() {
                    getPrice(new Item($(this)), function(price) {
                        if (!price) return;
                        price = price.replace(/\&\#?.+;/g, "");
                        var real = accounting.unformat(price, decsep);

                        winTot += real;
                        profile.find("#winnings").html(accounting.formatMoney(winTot, icon, 2, thousep, decsep));
                    });
                });
            }
        });
    });
}


ProfilePage.prototype.init = function() {
    this._init();
    this.addTotals();
}


//######################################################################
// TradePage
//######################################################################

var TradePage = function(user) {
    this.user = user;
}

TradePage.prototype = new BasePage();
TradePage.prototype.constructor = TradePage;


TradePage.prototype.init = function() {
    this._init();

    var steamid = $(".profilesmallheader>a").attr("href").match(/\d+/)[0];
    $(".profilesmallheader").append(
        $("<a>").attr("href", "http://steamcommunity.com/profiles/" + steamid + "/inventory").text("Inventory")
    );

    $(".tradepoll").after("<span id='lefttot' class='left standard'></span><span id='righttot' class='right standard'></span>");

    itemTotal($(".tradecnt .left .item"), function(total) {
        $("#lefttot").html(total);
    });

    itemTotal($(".tradecnt .right .item"), function(total) {
        $("#righttot").html(total);
    });

    $(".message").each(function() {
        if ($(this).find(".item").length > 0) {
            var self = $(this);
            itemTotal($(this).find(".item"), function(total) {
                console.log($(this));
                self.after("<div class='right standard' id='total'>" + total + "</div>");
            });
        }
    });
}

//######################################################################
// ITEMS
//######################################################################

var colors = {
    "Base": "#B0C3D9",
    "Consumer": "#B0C3D9",
    "Mil-Spec": "#4B69FF",
    "Industrial": "#5E98D9",
    "Hight": "#4B69FF",
    "Restricted": "#8847FF",
    "Remarkable": "#8847FF",
    "Classified": "#D32CE6",
    "Covert": "#EB4B4B",
    "Exotic": "#D32CE6",
    "Extraordinary": "#EB4B4B",
    "Contraband": "#E4AE39",

    "Common": "#B0C3D9",
    "Uncommon": "#5E98D9",
    "Rare": "#4B69FF",
    "Mythical": "#8847FF",
    "Immortal": "#E4AE39",
    "Legendary": "#D32CE6",
    "Arcana": "#ADE55C",
    "Ancient": "#EB4B4B"
}


var specialItems = [" + More",
    "Any Ancient",
    "Any Common",
    "Any Immortal",
    "Any Key",
    "Any Legendary",
    "Any Mythical",
    "Any Offers",
    "Any Rare",
    "Any Set",
    "Any Uncommon",
    "Dota Items",
    "Gift",
    "Knife",
    "Offers",
    "Real Money",
    "Real Money",
    "TF2 Items",
    "Undefined / Not Tradeable"
];

var PriceList = {};

var quality = {
    "Field-Tested": "FT",
    "Minimal Wear": "MW",
    "Battle-Scarred": "BS",
    "Well-Worn": "WW",
    "Factory New": "FN",
}

var Item = function(item) {
    var self = this;
    this.item = item;
    this.name = $('.smallimg', item).attr('alt');
    this.rarity = $('.rarity', item).attr('class').replace('rarity ', '');
    this.quality = $.trim($('.rarity', item).text());
};

Item.prototype.getColor = function() {
    if (this.rarity in colors) {
        return colors[this.rarity];
    }
    return null
};

Item.prototype.isSpecial = function() {
    return (specialItems.indexOf(this.name) > 0);
};


Item.prototype.getMiniQuality = function() {
    if (this.quality in quality)
        return quality[this.quality];
    return null;
};

Item.prototype.updatePrice = function() {
    var self = this;
    if (this.isSpecial())
        return;

    if (this.needQuality())
        this.item.prepend($("<div>").attr({
            "class": "la-clreff"
        }).text(quality[this.quality]));

    if (this.name in PriceList) {
        $(".rarity", self.item).text(PriceList[this.name]);
        return;
    }

    $(".rarity", self.item).text("Loading...");
    getPrice(this, function(price) {
        price = (price) ? price : "Not found";
        $(".rarity", self.item).text(price);
    });

    this.item.parents(".oitm").unbind("mouseenter");
};

Item.prototype.needStar = function() {
    if (this.item.hasClass("Star") && $(".clreff", this.item).length < 1)
        return true;
    return false;
};

Item.prototype.needQuality = function() {
    if (this.quality in quality && $(".la-clreff", this.item).length < 1)
        return true;
    return false;
};

Item.prototype.updateRarity = function() {
    if (this.isSpecial()) {
        $('.rarity', this.item).css({
            "visibility": "hidden"
        })
    }

    if (color = this.getColor()) {
        $('.rarity', this.item).css({
            "background-color": color
        })
    }

    if (this.quality == "")
        $(".rarity", this.item).text("-");

    if (this.needStar())
        this.item.prepend($("<div>").attr({
            "class": "clreff",
            "style": "background-color: #8650AC"
        }).text("★"));

}


Item.prototype.getApiUrl = function() {
    return "http://steamcommunity.com/market/priceoverview/?currency=" + user.getSetting('currency') + "&appid=" + APPID + "&market_hash_name=" + this.name;
}

//######################################################################
// MATCHES
//######################################################################

var Match = function(match) {
    this.match = match;
    this.url = BASEURL + $("a", this.match).last().attr("href");
    this.teams = [{
        "name": $(".teamtext>b", this.match).eq(0).text(),
        "odds": $(".teamtext>i", this.match).eq(0).text(),
        "win": $(".team", this.match).eq(0).find("img").length
    }, {
        "name": $(".teamtext>b", this.match).eq(1).text(),
        "odds": $(".teamtext>i", this.match).eq(1).text(),
        "win": $(".team", this.match).eq(1).find("img").length
    }];
    this.time = $(".whenm", this.match).eq(0).text();
}

Match.prototype.minimize = function() {
    var self = this;
    $('.la-minimize-match', this.match).text("+");
    $(".match", this.match).fadeOut(400, "swing", function() {
        $(".la-match-info", self.match).fadeIn();
    });
}

Match.prototype.maximize = function() {
    var self = this;
    $('.la-minimize-match', this.match).text("-");
    $(".la-match-info", this.match).fadeOut(400, "swing", function() {
        $(".match", self.match).fadeIn();
    });
}

Match.prototype.toggle = function() {
    if ($('.la-minimize-match', this.match).text() == "-")
        this.minimize();
    else
        this.maximize();
};

Match.prototype.update = function() {
    var self = this;
    $.get(self.url, function(data) {
        // Set "best of #"
        var bo = $(data).find(".half").eq(1).html();

        $('.matchleft>a>div', self.match).eq(1).attr({
            'class': 'la-bo'
        }).text(bo);

        // Set time in current Timezone
        var dt = new Date();
        var tzOffset = (dt.getTimezoneOffset() / 60) + 2;
        var CEST = $(data).find(".box-shiny-alt .half").eq(2).text();
        var AMorPM = "";

        hour = (CEST.match(/(\d{2}):(\d{2})/)[1] - tzOffset) % 24;
        minute = CEST.match(/(\d{2}):(\d{2})/)[2];
        if (hour < 0) hour = 24 + hour;
        if (user.getSetting("timeFormat") == "12h")
            if (hour == 12) {
                AMorPM = " PM";
            } else if (hour > 12) {
            hour = hour - 12;
            AMorPM = " PM";
        } else {
            AMorPM = " AM";
        }

        hour = hour < 10 ? "0" + hour : hour;
        $(".la-time-match", self.match).text(" ( " + hour + ":" + minute + AMorPM + " )");
    });
    this.match.unbind("mouseenter");
}

Match.prototype.load = function() {
    var self = this;
    $(".matchheader>.whenm:first-child", this.match).prepend($("<a>").attr({
        "class": "la-minimize-match"
    }).text("-"));
    $(".matchheader>.whenm:first-child", this.match).append($("<span>").attr({
        "class": "la-time-match"
    }));
    $(".matchheader>.whenm:first-child", this.match).append($("<div>").attr({
        "class": "la-match-info"
    }).hide());

    var wins = [
        (this.teams[0].win ? $("<img>").attr({
            "height": "20px",
            "src": "/img/won.png"
        }) : null), (this.teams[1].win ? $("<img>").attr({
            "height": "20px",
            "src": "/img/won.png"
        }) : null),
    ];


    $(".la-match-info", this.match)
        .append(
            $("<b>").append(this.teams[0].name).append(wins[0])
        )
        .append($("<i>").text(this.teams[0].odds))
        .append($("<span>").attr('class', 'la-vs').text("vs"))
        .append($("<i>").text(this.teams[1].odds))
        .append(
            $("<b>").append(this.teams[1].name).append(wins[1])
        );


    $(".la-minimize-match", this.match).click(function() {
        self.toggle();
    });

    $('.matchleft>a>div', this.match).eq(1).attr({
        'class': 'la-bo'
    }).text('-');
}

// ################################################################################

function itemTotal(items, callback) {
    var total = 0,
        totaled = 0,
        len, i;
    var icon = user.getSetting("currencyIcon");

    var decsep = ".",
        thousep = ",";

    if (icon === "€") {
        decsep = ",";
        thousep = "."
    }

    for (i = 0, len = items.length; i < len; i++) {
        getPrice(new Item(items[i]), function(price) {
            if (price)
                total += accounting.unformat(price);
            totaled++;
            if (totaled == len) {
                callback(accounting.formatMoney(total, icon, 2, thousep, decsep));
            }
        });
    }
}

function getPrice(item, callback) {
    if (item.name in PriceList) {
        callback(PriceList[item.name]);
        return;
    }

    $.getJSON(item.getApiUrl(), function(json) {
        var price = null;
        if (json.success) {
            if (typeof json.lowest_price != 'undefined')
                price = json.lowest_price;
            else if (typeof json.median_price != 'undefined')
                price = json.median_price;
        }
        price = $.parseHTML(price)[0].data; // Using parseHTML to avoid xss from steam ><
        PriceList[self.name] = price;
        callback(price);
    }).fail(function() {
        callback(null);
    });
}

function updateTrade() {
    $("#la-trade").text("Loading ...");

    $.get(BASEURL + "/mytrades", function(data) {
        var tradesnb = $(data).find(".tradeheader").length;

        $.each($(data).find(".tradeheader>.buttonright"), function(idx, item) {
            bumps_url.push($(item).attr("onclick").match(/\d+/)[0]);
        });
        $("#la-trade").text(tradesnb + " trade" + (tradesnb > 1 ? 's' : '') + '  / Bump ' + bumps_url.length);

        var newtrade = 0;
        $.each($(data).find(".tradeheader>.notification"), function(idx, data) {
            newtrade += parseInt($(data).text().match(/^\d+/)[0]);
        });
        if (newtrade)
            $("#menu>li").eq(1).append($("<div>").attr({
                'class': 'notification'
            }).text(newtrade));
    });


}

function trade() {
    updateTrade();

    $("#la-trade").click(function() {
        $.each(bumps_url, function(idx, trade) {
            $.ajax({
                type: "POST",
                url: BASEURL + "/ajax/bumpTrade.php",
                data: "trade=" + trade
            });
        });

        bumps_url = [];
        updateTrade();
    });
}


function startObserver(page) {
    var observer = new MutationObserver(function(mutations) {
        var self = this;
        mutations.forEach(function(mutation) {
            var newNodes = mutation.addedNodes;
            if (newNodes !== null && newNodes.length > 0) {
                $.each(newNodes, function(idx, n) {
                    if (n.nodeName != "#text") {
                        self.disconnect();
                        page.updateItems();
                        self.observe(document.body, {
                            childList: true,
                            subtree: true,
                            characterData: true
                        });
                        return false;
                    }
                });
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });
}


function main(user) {
    var basePage = new BasePage(user);
    var page = basePage.getPage()
    page.init();

    $("#modalPreview").append($("<a>").attr({
        'id': 'modalMarket',
        'class': 'button',
        'href': '#'
    }).text('Market'));

    if (isLogged) {
        trade();
    }
    startObserver(page);
}


var user = new User();
user.loadSettings(main);
