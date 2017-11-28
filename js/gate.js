var Gate = function (type, x, y) {
    // Attributes

    this.x = x * gridUnit;
    this.y = y * gridUnit;
    this.type = type;
    this.sprite = game.add.sprite(this.x, this.y, type);
    this.updated = new Phaser.Signal();
    this.input1 = false;
    this.input2 = false;

    this.parents = [];

    // Methods

    this.drawConnections = function () {
        for(var i = 0; i < this.parents.length; i++) {
        	var parent = this.parents[i];
            var goalX = this.x;
            if(this.type == "not") {
            	var goalY = this.y + 25;
            } else {
            	if(i === 0) {
            		var goalY = this.y + 13;
            	} else {
                	var goalY = this.y + 37;
            	}
            }
            if(parent.type == "input") {
            	var startX = parent.x + 25;
            	var startY = parent.y + 12;
            } else {
            	var startX = parent.x + 50;
            	var startY = parent.y + 25;
            }
            drawConnection(startX, startY, goalX, goalY, this.parents[i].on);
        }
    };

    this.register = function (parent) {
        this.parents.push(parent);
        parent.updated.add(this.updateValues, this);
    };

    this.updateValues = function () {
        if (this.parents[0]) {
            this.input1 = this.parents[0].on;
        } else {
            this.input1 = false;
        }
        if (this.parents[1]) {
            this.input2 = this.parents[1].on;
        } else {
            this.input2 = false;
        }
        this.evaluate();
    };

    this.evaluate = function () {
        switch (this.type){
            case 'and': this.on = this.input1 && this.input2;
                break;
            case 'or': this.on = this.input1 || this.input2;
                break;
            case 'not': this.on = !this.input1;
                break;
            default: this.on = false;
        }
        this.updated.dispatch();
    };

    this.addChild = function (child) {
        child.register(this);
    };

}

