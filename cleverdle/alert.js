/* 
   New Alert Box (replacement for browser alert box)
   Version 1.0
   June 29, 2018

   Will Bontrager Software LLC
   https://www.willmaster.com/
   Copyright 2018 Will Bontrager Software LLC

   This software is provided "AS IS" without any warranty of any kind. 
*/

var NewAlertScreenIDvalue = "new-alert-box-screen";
var NewAlertDivIDvalue = "new-alert-box-div";
var NewAlertTextIDvalue = "new-alert-box-text";

function RemoveNewAlert() {
    var d = document.getElementById(NewAlertDivIDvalue).style.display = "none";
    var screen = NewAlertScreenIDvalue.length ? document.getElementById(NewAlertScreenIDvalue) : false;
    if (screen) {
        screen.style.display = "none";
    }
}

function NewAlert(s) {
    s = s.replace("\n", "<br>")
    var scrolltop = NewAlertDocumentScrollPositionTop();
    var scrollleft = NewAlertDocumentScrollPositionLeft();
    var docheight = NewAlertDocumentHeight();
    var docwidth = NewAlertDocumentWidth();
    var viewheight = NewAlertViewportHeight();
    var viewwidth = NewAlertViewportWidth();
    var d = document.getElementById(NewAlertDivIDvalue);
    var text = document.getElementById(NewAlertTextIDvalue);
    var screen = NewAlertScreenIDvalue.length ? document.getElementById(NewAlertScreenIDvalue) : false;
    if (screen) {
        screen.style.height = docheight + "px";
        screen.style.width = docwidth + "px";
        screen.style.left = "0px";
        screen.style.top = "0px";
        screen.style.display = "block";
    }
    d.style.display = "block";
    text.innerHTML = s;
    var divwidth = d.offsetWidth;
    var divheight = d.offsetHeight;
    var topposition = parseInt(((viewheight - divheight) / 2) + scrolltop);
    var leftposition = parseInt(((viewwidth - divwidth) / 2) + scrollleft);
    if (topposition < 0) {
        topposition = 0;
    }
    if (leftposition < 0) {
        leftposition = 0;
    }
    d.style.top = topposition + "px";
    d.style.left = leftposition + "px";
}

function NewAlertDocumentScrollPositionTop() {
    if (self.pageYOffset) {
        return self.pageYOffset;
    } else if (document.documentElement && document.documentElement.scrollTop) {
        return document.documentElement.scrollTop;
    } else if (document.body) {
        return document.body.scrollTop;
    }
}

function NewAlertDocumentScrollPositionLeft() {
    if (self.pageYOffset) {
        return self.pageXOffset;
    } else if (document.documentElement && document.documentElement.scrollLeft) {
        return document.documentElement.scrollLeft;
    } else if (document.body) {
        return document.body.scrollLeft;
    }
}

function NewAlertDocumentWidth() {
    return Math.max(
        (document.body.scrollWidth ? document.body.scrollWidth : 0),
        (document.body.offsetWidth ? document.body.offsetWidth : 0),
        (document.body.clientWidth ? document.body.clientWidth : 0),
        (document.documentElement.scrollWidth ? document.documentElement.scrollWidth : 0),
        (document.documentElement.offsetWidth ? document.documentElement.offsetWidth : 0)
    );
}

function NewAlertDocumentHeight() {
    return Math.max(
        (document.body.scrollHeight ? document.body.scrollHeight : 0),
        (document.body.offsetHeight ? document.body.offsetHeight : 0),
        (document.body.clientHeight ? document.body.clientHeight : 0),
        (document.documentElement.scrollHeight ? document.documentElement.scrollHeight : 0),
        (document.documentElement.offsetHeight ? document.documentElement.offsetHeight : 0)
    );
}

function NewAlertViewportWidth() {
    return Math.max(
        (self.innerWidth ? self.innerWidth : 0),
        (document.documentElement.clientWidth ? document.documentElement.clientWidth : 0)
    );
}

function NewAlertViewportHeight() {
    return Math.max(
        (self.innerHeight ? self.innerHeight : 0),
        (document.documentElement.clientHeight ? document.documentElement.clientHeight : 0)
    );
}