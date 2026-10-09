import Phaser from 'phaser';

class SceneFighter extends Phaser.Scene {
  constructor() {
    super('SceneFighter');
  }

  create() {
    this.cameras.main.setBackgroundColor('#222233');
    
    const width = this.scale.width;
    const height = this.scale.height;

    // GUI: Health Bars
    this.add.text(20, 20, 'PLAYER 1', { font: '16px Courier', fill: '#00f3ff' });
    this.add.text(width - 100, 20, 'CPU', { font: '16px Courier', fill: '#ff0055' });
    
    this.p1HealthBar = this.add.rectangle(20, 45, 150, 15, 0x00f3ff).setOrigin(0, 0);
    this.p2HealthBar = this.add.rectangle(width - 170, 45, 150, 15, 0xff0055).setOrigin(0, 0);

    // Ground
    const ground = this.add.rectangle(width/2, height - 40, width, 80, 0x111122);
    this.physics.add.existing(ground, true); // static body

    // Players
    // We create simple rectangles
    this.p1 = this.add.rectangle(100, height - 150, 40, 100, 0x00f3ff);
    this.p2 = this.add.rectangle(width - 100, height - 150, 40, 100, 0xff0055);
    
    this.physics.add.existing(this.p1);
    this.physics.add.existing(this.p2);
    
    this.p1.body.setCollideWorldBounds(true);
    this.p2.body.setCollideWorldBounds(true);
    this.p1.body.setGravityY(800);
    this.p2.body.setGravityY(800);
    
    this.physics.add.collider(this.p1, ground);
    this.physics.add.collider(this.p2, ground);
    this.physics.add.collider(this.p1, this.p2); // can't walk through each other
    
    // Player State
    this.p1HP = 100;
    this.p2HP = 100;
    this.p1Attacking = false;
    this.p2Attacking = false;
    this.gameOver = false;
    
    // Hitboxes (invisible rectangles)
    this.p1Hitbox = this.add.rectangle(0, 0, 40, 20, 0xffffff, 0.5);
    this.p2Hitbox = this.add.rectangle(0, 0, 40, 20, 0xffffff, 0.5);
    this.physics.add.existing(this.p1Hitbox);
    this.physics.add.existing(this.p2Hitbox);
    this.p1Hitbox.body.setAllowGravity(false);
    this.p2Hitbox.body.setAllowGravity(false);
    this.p1Hitbox.setVisible(false);
    this.p2Hitbox.setVisible(false);

    // Overlaps for damage
    this.physics.add.overlap(this.p1Hitbox, this.p2, () => this.hit(this.p2, 1), null, this);
    this.physics.add.overlap(this.p2Hitbox, this.p1, () => this.hit(this.p1, 2), null, this);

    // Virtual Controls setup
    this.keys = {
      left: false,
      right: false,
      up: false,
      attack: false
    };

    this.createVirtualControls(width, height);
    
    // Keyboard fallback
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // HUD Messages
    this.msgText = this.add.text(width/2, height/2, 'FIGHT!', { font: 'bold 48px Courier', fill: '#fff' }).setOrigin(0.5);
    this.time.delayedCall(1000, () => {
      this.msgText.setText('');
    });
  }

  createVirtualControls(width, height) {
    // D-PAD
    const padX = 80;
    const padY = height - 100;
    
    const btnLeft = this.add.circle(padX - 50, padY, 30, 0xffffff, 0.2).setInteractive();
    const btnRight = this.add.circle(padX + 50, padY, 30, 0xffffff, 0.2).setInteractive();
    const btnUp = this.add.circle(padX, padY - 50, 30, 0xffffff, 0.2).setInteractive();
    
    // Action Buttons
    const btnAtk = this.add.circle(width - 80, padY, 40, 0xff0055, 0.4).setInteractive();
    
    // Add text labels
    this.add.text(padX - 50, padY, '<', {fontSize:'24px'}).setOrigin(0.5);
    this.add.text(padX + 50, padY, '>', {fontSize:'24px'}).setOrigin(0.5);
    this.add.text(padX, padY - 50, '^', {fontSize:'24px'}).setOrigin(0.5);
    this.add.text(width - 80, padY, 'ATK', {fontSize:'18px'}).setOrigin(0.5);

    // Handlers
    btnLeft.on('pointerdown', () => this.keys.left = true).on('pointerup', () => this.keys.left = false).on('pointerout', () => this.keys.left = false);
    btnRight.on('pointerdown', () => this.keys.right = true).on('pointerup', () => this.keys.right = false).on('pointerout', () => this.keys.right = false);
    btnUp.on('pointerdown', () => this.keys.up = true).on('pointerup', () => this.keys.up = false).on('pointerout', () => this.keys.up = false);
    btnAtk.on('pointerdown', () => this.keys.attack = true).on('pointerup', () => this.keys.attack = false).on('pointerout', () => this.keys.attack = false);
  }

  hit(target, attackerId) {
    if (this.gameOver) return;
    
    if (attackerId === 1 && this.p1Attacking) {
      this.p2HP -= 10;
      this.p1Attacking = false; // hit only once per attack animation
      this.p2.body.velocity.x = 200; // knockback
      this.p2.fillColor = 0xffffff;
      this.time.delayedCall(100, () => this.p2.fillColor = 0xff0055);
    } 
    else if (attackerId === 2 && this.p2Attacking) {
      this.p1HP -= 10;
      this.p2Attacking = false;
      this.p1.body.velocity.x = -200;
      this.p1.fillColor = 0xffffff;
      this.time.delayedCall(100, () => this.p1.fillColor = 0x00f3ff);
    }
    
    // Update bars
    this.p1HealthBar.width = Math.max(0, (this.p1HP / 100) * 150);
    this.p2HealthBar.width = Math.max(0, (this.p2HP / 100) * 150);

    if (this.p1HP <= 0 || this.p2HP <= 0) {
      this.gameOver = true;
      this.msgText.setText(this.p1HP <= 0 ? 'YOU LOSE' : 'YOU WIN!');
      
      if(this.p1HP <= 0) this.p1.angle = 90;
      if(this.p2HP <= 0) this.p2.angle = -90;

      this.time.delayedCall(3000, () => {
        this.scene.restart();
      });
    }
  }

  update() {
    if (this.gameOver) return;

    // Reset hitboxes
    this.p1Hitbox.body.x = -1000;
    this.p2Hitbox.body.x = -1000;

    // Player 1 Input
    const speed = 200;
    if (this.keys.left || this.cursors.left.isDown) {
      this.p1.body.setVelocityX(-speed);
    } else if (this.keys.right || this.cursors.right.isDown) {
      this.p1.body.setVelocityX(speed);
    } else {
      this.p1.body.setVelocityX(0);
    }

    if ((this.keys.up || this.cursors.up.isDown) && this.p1.body.touching.down) {
      this.p1.body.setVelocityY(-500);
    }

    // Player 1 Attack
    if ((this.keys.attack || this.spaceBar.isDown) && !this.p1AttackingTimer) {
      this.p1Attacking = true;
      this.p1AttackingTimer = this.time.delayedCall(300, () => {
        this.p1Attacking = false;
        this.p1AttackingTimer = null;
      });
    }
    
    if (this.p1Attacking) {
      this.p1Hitbox.body.x = this.p1.x + 20; // right side (assuming facing right)
      this.p1Hitbox.body.y = this.p1.y - 10;
      // visuals for attack
      this.p1Hitbox.setVisible(true);
    } else {
      this.p1Hitbox.setVisible(false);
    }

    // Player 2 (CPU) AI
    const dist = this.p1.x - this.p2.x;
    
    if (Math.abs(dist) > 60) {
      // Move towards P1
      this.p2.body.setVelocityX(dist > 0 ? speed * 0.8 : -speed * 0.8);
    } else {
      this.p2.body.setVelocityX(0);
      // Attack randomly if close
      if (!this.p2AttackingTimer && Phaser.Math.Between(1, 100) > 90) {
        this.p2Attacking = true;
        this.p2AttackingTimer = this.time.delayedCall(300, () => {
          this.p2Attacking = false;
          this.p2AttackingTimer = null;
        });
      }
    }

    // P2 jump randomly
    if (this.p2.body.touching.down && Phaser.Math.Between(1, 1000) > 990) {
      this.p2.body.setVelocityY(-400);
    }

    if (this.p2Attacking) {
      this.p2Hitbox.body.x = this.p2.x - 60; // left side (assuming facing left)
      this.p2Hitbox.body.y = this.p2.y - 10;
      this.p2Hitbox.setVisible(true);
    } else {
      this.p2Hitbox.setVisible(false);
    }
    
    // Facing logic (simple)
    // If we were using sprites, we would flipX here depending on who is to the left/right.
  }
}

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 }, // controlled manually per body
      debug: false
    }
  },
  scene: [SceneFighter]
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});
