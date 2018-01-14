var Input = function (x, y, on, level) {

    // Attributes /////////////////////////////////////////
    this.on = on || true;
    this.x = x * gridUnit;
    this.y = y * gridUnit;
    this.type = "input";
    this.level = level;
    this.updated = new Phaser.Signal();
    
    // Methods ///////////////////////////////////////////

    this.init = function () {
        this.sprite = game.add.sprite(this.x, this.y, 'on');
        this.sprite.inputEnabled = true;
        this.sprite.events.onInputDown.add(this.toggle, this);
        
        this.updated.dispatch();

        this.show();
    }
    this.show = function () {
        if(this.on) {
            this.sprite.loadTexture('on');
        } else {
            this.sprite.loadTexture('off');
        }
    };

    this.toggle = function () {
        if(!this.level.inputsDisabled) {
            this.on = !this.on;
            this.show();
            this.updated.dispatch();
        }
    };

    this.addChild = function (child) {
        child.register(this);
        this.updated.dispatch();
    };

};