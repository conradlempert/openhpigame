var Level = function (name, type = "challenge", expression = "", winAction = function() {}) {

    console.log("Hello level" + name);

	this.name = name;
	this.inputs = [];
	this.outputs = [];
	this.gates = [];
	this.winAction = winAction;
	this.type = type;
	this.completed = false;
	this.expression = expression;
	this.window = {x:0, y:statusBarHeight, width:game.width, height:game.height - 40};
	this.backgroundImage = "defaultBg";
	this.destroyableGraphics = [];
	this.dialogue = null;
	this.graphics = game.make.graphics(0,0);
    this.group;// = game.make.group();

	// element: Every element that should disappear when the level is closed is passed to this function
	this.registerToDestroy = function(element) {
        this.destroyableGraphics.push(element);
    }

	this.addInput = function (name, x, y, on, locked = false) {
		var input = new Input(name, x, y, on, this, locked);
		this.inputs.push(input);
		//this.group.add(input.group);
		return input;
	}
	this.addOutput = function (expected, x, y, name) {
		var output = new Output(expected, x, y, this, name);
		this.outputs.push(output);
        //this.group.add(output);
		return output;
	}
	this.addGate = function (type, x, y) {
		var gate = new Gate(type, x, y, this, this.group);
		this.gates.push(gate);
		//this.group.add(gate);
		return gate;
	}

	this.update = () => {
        for(var i = 0; i < this.gates.length; i++) {
            this.gates[i].drawConnections();
        }
        for(var i = 0; i < this.outputs.length; i++) {
            this.outputs[i].drawConnections();
            this.outputs[i].show();
        }
    }

	this.show = (room) => {

	    console.log("level show: "+ name);
	    this.room = room;

        this.group = game.add.group();

        this.group.x = 100;
        this.group.y = 100;

        this.bgSprite = game.add.sprite(this.window.x, this.window.y, this.backgroundImage);
        //this.group.create(0, 0, this.backgroundImage);
        this.group.add(this.bgSprite);

        this.bgSprite.width = this.window.width;
        this.bgSprite.height = this.window.height;

        for (var i = 0; i < this.outputs.length; i++) {
            this.outputs[i].init();
            this.group.add(this.outputs[i].group);
        }
        for (var i = 0; i < this.gates.length; i++) {
            this.gates[i].init();
            this.group.add(this.gates[i].group);
        }
        for (var i = 0; i < this.inputs.length; i++) {
            this.inputs[i].init();
            this.group.add(this.inputs[i].group);
        }
        switch(type) {
            case "challenge":
                this.playButton = drawButton(I18n.t("game.buttons.play"), 100, statusBarHeight, "black", this.checkWin, this);
                this.group.add(this.playButton);
                this.simulationMode = false;
                break;
            case "lernItem":
                this.simulationMode = true;
                break;
            case "choice":
                for(var i = 0; i < this.choices.length; i++) {
                    var button = drawButton(I18n.t("game.buttons.choose"), 100 + i*300, 300, "black", (button) => {this.checkChoice(button.id)}, this);
                    // this.registerToDestroy(button);
                    this.group.add(button);

                    button.button.id = i;
                }
                this.simulationMode = true;
                break;
            default:
                console.log(this.name + ": Invalid Level type!");
                break;
        }

        this.inputsDisabled = false;

//        this.backButton = game.add.button(0, statusBarHeight, 'back', this.room.closeLevel, this, 2, 1, 0);
        this.backButton = game.add.button(0, 0, 'back', this.room.closeLevel, this, 2, 1, 0);
        //this.registerToDestroy(this.backButton);

        this.group.add(this.backButton);

        this.winText = game.add.text(300, 60, "", style);
        //this.registerToDestroy(this.winText);
        this.group.add(this.winText);


        this.expressionText = game.add.text(0, 0, this.expression, style);
        this.expressionText.setTextBounds(0, 0, this.window.x + this.window.width - 10, this.window.y + this.window.height - 5);
        //this.registerToDestroy(this.expressionText);
        this.group.add(this.expressionText);
		this.update();

		if(this.dialogue != null) {
		    new Dialogue(this.dialogue);
		    if(this.type == "challenge") {
		        dialogueOpen = true;
            }
        }

//        this.group.add(window.graphics);

		game.add.graphics(this.graphics);

        game.add.group(this.group);
	}


	this.checkChoice = function(index) {
        if(this.choices[index]) {
            this.completed = true;
            this.win();
        } else {
            this.fail();
        }
    }

	this.checkWin = function() {

	    if(!dialogueOpen) {

            this.simulationMode = true;
            this.inputsDisabled = true;

            this.playButton.destroy();

            this.completed = true;
            for (var i = 0; i < this.outputs.length; i++) {
                this.completed = (this.outputs[i].on === this.outputs[i].expected) && this.completed;
            }
            if (this.completed) {
                this.win();
            } else {
                this.fail();
            }
        }
	}

	this.drawConnection = function(startX, startY, goalX, goalY, on) {
//	    console.log("Draw Connection.");
//		if(!dialogueOpen) {
			var midX = (startX + goalX) / 2;
//			var graphics = game.add.graphics(0, 0);
        this.graphics.clear();

            this.graphics.lineStyle(3, 0xffff00, 1);
			if (this.simulationMode) {
				if (on) {
					this.graphics.lineStyle(3, 0x00ff00, 1);
				} else {
					this.graphics.lineStyle(3, 0xff0000, 1);
				}
			}
			this.graphics.moveTo(startX, startY);
			this.graphics.lineTo(midX, startY);
			this.graphics.lineTo(midX, goalY);
			this.graphics.lineTo(goalX, goalY);

//			window.graphics = graphics;
//		}
	}

	this.fail = function() {
		this.winText.text = I18n.t("game.texts.wrong");
        new Dialogue("dialogue.fail", this.room.closeLevel);
    }


	// Löscht alle Elemente, die this.registerToDestroy() übergeben wurden
    this.destroy = () =>
    {
        console.log("Destroy");
        if (this.type == "lernItem") {
            this.winAction();
        }
        this.group.destroy();
    }

    this.win = function () {
	    if(this.room.nr >= progress) {
            raiseScore();
        }
        this.winText.text = I18n.t("game.texts.correct");
        window.setTimeout(this.winAction, 1000);
    }

}