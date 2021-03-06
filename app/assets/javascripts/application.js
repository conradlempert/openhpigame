// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, or any plugin's
// vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file. JavaScript code in this file should be added after the last require_* statement.
//
// Read Sprockets README (https://github.com/rails/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require rails-ujs
//= require turbolinks
//= require i18n.js
//= require i18n/translations
//= require_tree .

if (window.location.pathname === '/') {

    var game = new Phaser.Game(800, 616, Phaser.AUTO, 'game', {preload: preload, create: create});
    var gridUnit = 25;
    var maxScore = 8;
    var statusBarHeight = 50;
    var progress = 0;
    var score = 0;
    var dialogueOpen = false;
    var style = {font: "bold 32px Arial", fill: "#fff", boundsAlignH: "right", boundsAlignV: "bottom"};
}

gameElements = {
    gates: [],
    inputs: [],
    outputs: []
};


function preload() {
    game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
    game.scale.pageAlignVertically = true;
    game.scale.pageAlignHorizontally = true;
    game.scale.setUserScale(fitSize(800, 650));
    game.scale.refresh();

    window.addEventListener("resize" , function () {
        game.scale.setUserScale(fitSize(800, 650));
        game.scale.refresh();
    });

    game.load.video('intro', 'assets/intro.mp4');
    game.load.image('logo', 'assets/openhpi.jpg');
    game.load.image('on', 'assets/on.png');
    game.load.image('off', 'assets/off.png');
    game.load.image('neutral', 'assets/neutral.png');
    game.load.image('and', 'assets/and.png');
    game.load.image('or', 'assets/or.png');
    game.load.image('not', 'assets/not.png');
    game.load.image('equals', 'assets/equals.png');
    game.load.image('defaultBg', 'assets/defaultBg.jpg')
    game.load.image('back', 'assets/button_back.png');
    game.load.image('button_empty', 'assets/button_empty.png');
    game.load.image('computer', 'assets/computer.png');
    game.load.image('pad', 'assets/pad.jpg');
    game.load.image('robot', 'assets/robot.png');
    game.load.image('grid', 'assets/gitter.jpg');
    game.load.image('pixel', 'assets/bubble.png');
    game.load.image('toaster', 'assets/toaster.png');
    game.load.image('lock', 'assets/lock.png');
    game.load.spritesheet('pigeon', 'assets/pigeon.png', 84, 84);
    game.load.image('eric', 'assets/eric.png');
    game.load.image('status', 'assets/status.jpg');
    game.load.image('finalroom', 'assets/finalroom.png');
    game.load.image('samenkorn', 'assets/samenkorn.png');
    game.load.image('mouse', 'assets/rat.png');
    game.load.image('sterni', 'assets/sterni.png');
    game.load.image('mona_lisa', 'assets/mona_lisa.jpg');
    game.load.image('imac', 'assets/imac.png');
    game.load.image('modern', 'assets/modern.png');
    game.load.image('transparent', 'assets/transparent.png');
}

function create() {

    room1_1 = new Room('room1_1','Room_animals_klein.png', 1, true);
    // tuer
    room1_1.addItem(new Item(360, 300, 80, 120, room1_1, { type: "endlevel" }, true));
/*    room1_1.addItem(new Item(200, 500, 'pigeon', room1_1,
        {
            type: "animation",
            fps: 30
        }
    )); */
    // baer
    room1_1.addItem(new Item(250, 250, 60, 120, room1_1,
        {
            type: "level",
            level: createItemAnd()
        }, true));
    // katze
    room1_1.addItem(new Item(170, 330, 70, 70, room1_1,
        {
            type: "level",
            level: createItemInput()
        }));
    // flamingo
    room1_1.addItem(new Item(500, 270, 80, 80, room1_1,
        {
            type: "level",
            level: createItemOr()
        }, true));

    room1_2 = new Room('room1_2','Room_art_locked_klein.png', 2, true);
    // door
    room1_2.addItem(new Item(370, 320, 100, 100, room1_2, { type: "endlevel" }, true));
    // starry night
    room1_2.addItem(new Item(580, 290, 130, 100, room1_2,
        {
            type: "level",
            level: createItemEquals()
        }, true));
    room1_2.addItem(new Item(100, 230, 120, 100, room1_2,
        {
            type: "level",
            level: createItemNot()
        }, true));

    room2 = new Room('room2','Room_history_klein.png', 3);
    room2.addItem(new Item(360, 300, 80, 100, room2, { type: "endlevel" }));

    room3 = new Room('room3','Room_music_locked_klein.png', 4);
    robotPopUp = new PopUp(450, 290, 'pixel');
    room3.addItem(new Item(350, 300, 100, 100, room3, { type: "endlevel" }));
    //room3.addItem(new Item(630, 480, 100, 100, room3));
    room3.addItem(new Item(570, 250, 100, 100, room3,
        {
            type: "level",
            level: createItemLevel3_NotEqual()
        }));

    room4 = new Room('room4', 'Room_final_shadow_klein.png', 5);




    room1_1.endLevels = [createLevel1_1()];
    room1_2.endLevels = [createLevel1_2()];
    room2.endLevels = [createLevel2_1(), createLevel2_2(), createLevel2_3()];
    room3.endLevels = [createlevel3_1(), createLevel3_2(), createLevel3_3()];

    room1_1.nextRoom = room1_2;
    room1_2.nextRoom = room2;
    room2.nextRoom = room3;
    room3.nextRoom = room4;

    room1_1.inDialogue = "r1.d1";
    room2.inDialogue = "r2.entrance";
    room2.outDialogue = "r2.out";
    room4.inDialogue = "r4.entrance";

    I18n.locale = "de";
    score = 0;
    if(isSafari()) {
       // room1_1.show();
       room4.show();
    } else {
        /*video = game.add.video('intro');
        video.onComplete.dispatch = function () {
            room1_1.show();
        };
        video.play(false);
        video.addToWorld();*/
        room3.show();
    }

}

function raiseScore(firstTry) {
    if (firstTry) {
        score++;
    } else {
        score += 0.5;
    }
    updateScore(score / maxScore);
    showStatusBar();
}


function updateScore() {
    console.log("update score to:"+score);
    var http = new XMLHttpRequest();
    var url = "/update_score";
    var params = "score=" + score;
    http.open("POST", url, true);
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    http.onreadystatechange = function() {
        if(http.readyState == 4 && http.status == 200) {
            console.log("score updated successfully.")
            console.log(http.response)
        }
    };
    http.send(params);
}

function finishQuiz() {
    window.location.href = '/quiz_finished'
}

function showStatusBar() {
    game.add.sprite(0,0,'status');
    var style = { font: "30px Arial", fill: "black" };
    if(progress > 1) {
        drawButton(I18n.t("game.buttons.room") + " 2", 300, 0, "#ffffff", room1_2.show, room1_2);
    }
    if(progress > 2) {
        drawButton(I18n.t("game.buttons.room") + " 3", 400, 0, "#ffffff", room2.show, room2);
    }
    if(progress > 3) {
        drawButton(I18n.t("game.buttons.room") + " 4", 500, 0, "#ffffff", room3.show, room3);
    }
    drawButton(I18n.t("game.buttons.room") + " 1", 200, 0, "#ffffff", room1_1.show, room1_1);
    drawButton(I18n.t("game.buttons.send"), 660, 0, "#ffffff", updateScore, null);
    scoreText = game.add.text(10, 6, I18n.t("game.texts.score") + ": " + score + "/" + maxScore, style);
}

function drawButton(text, x, y, color, callback, reference) {

    var button = game.add.button(x, y + 2, "button_empty", callback, reference, 2, 1, 0);
    var style = { font: "24px Arial", fill: "black" };
    var text = game.add.text(x + 14, y + 10, text, style);

    var group = game.make.group();
    group.add(button);
    group.add(text);

    return {
        group: group,
        button: button,
        text: text,
        destroy: () => {
        button.destroy();
    text.destroy();
}
    };
}

function isSafari() {
    var ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('safari') != -1) {
        if (ua.indexOf('chrome') > -1) {
            return false;
        } else {
            return true;
        }
    }
    return false;
}

function fitSize(width, height) {
    var ww = window.innerWidth - 20;
    var wh = window.innerHeight - 50;
    var gameRatio = width/height;
    var screenRatio = ww/wh;

    if(gameRatio > screenRatio) {
        return ww/width
    } else {
        return wh/height
    }
}
