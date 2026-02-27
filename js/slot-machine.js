// 娱乐老虎机游戏 - 完整主逻辑
class SlotMachineGame {
    constructor() {
        this.gameState = {
            coins: 1000,
            betAmount: 100,
            gamesPlayed: 0,
            gamesWon: 0,
            winStreak: 0,
            maxStreak: 0,
            totalWinnings: 0,
            maxWin: 0,
            playTime: 0, // 分钟
            achievements: {},
            soundEnabled: true
        };
        
        this.symbols = [
            { emoji: '🍒', name: '樱桃', multiplier: 3 },
            { emoji: '🍋', name: '柠檬', multiplier: 5 },
            { emoji: '🍊', name: '橙子', multiplier: 7 },
            { emoji: '⭐', name: '星星', multiplier: 10 },
            { emoji: '🔔', name: '铃铛', multiplier: 15 },
            { emoji: '7️⃣', name: '幸运7', multiplier: 20 },
            { emoji: '🎰', name: '老虎机', multiplier: 25 },
            { emoji: '👑', name: '皇冠', multiplier: 30 }
        ];
        
        this.achievementsList = [
            { id: 'first_win', name: '首胜', desc: '赢得第一次游戏', icon: '🥇', points: 10 },
            { id: 'big_winner', name: '大赢家', desc: '单次赢得500虚拟币', icon: '💰', points: 20 },
            { id: 'streak_master', name: '连胜大师', desc: '达成5连胜', icon: '🔥', points: 30 },
            { id: 'veteran', name: '老玩家', desc: '游玩50次游戏', icon: '🎮', points: 25 },
            { id: 'jackpot', name: '头奖', desc: '中得最高倍数', icon: '🎯', points: 50 },
            { id: 'collector', name: '收藏家', desc: '解锁所有成就', icon: '🏆', points: 100 }
        ];
        
        this.isSpinning = false;
        this.spinTimeout = null;
        this.playTimer = null;
        this.forcedWinSymbol = null; // 强制中奖的符号
        
        this.initElements();
        this.initEventListeners();
        this.initReels();
        this.loadGameState();
        this.updateDisplay();
        this.updateAchievementsDisplay();
        this.startPlayTimer();
    }
    
    initElements() {
        // 获取DOM元素
        this.reel1 = document.getElementById('reel1');
        this.reel2 = document.getElementById('reel2');
        this.reel3 = document.getElementById('reel3');
        this.spinButton = document.getElementById('spin-btn');
        this.coinCount = document.getElementById('coin-count');
        this.currentCoins = document.getElementById('current-coins');
        this.winStreakElement = document.getElementById('win-streak');
        this.gamesPlayedElement = document.getElementById('games-played');
        this.winRate = document.getElementById('win-rate');
        this.resultDisplay = document.getElementById('result-display');
        this.lastWin = document.getElementById('last-win');
        this.achievementsGrid = document.getElementById('achievements-grid');
        this.playTimeElement = document.getElementById('play-time');
        this.maxWinElement = document.getElementById('max-win');
        this.maxStreakElement = document.getElementById('max-streak');
        this.achievementPointsElement = document.getElementById('achievement-points');
        this.jackpot = document.getElementById('jackpot');
        
        // 音效
        this.spinSound = document.getElementById('spin-sound');
        this.winSound = document.getElementById('win-sound');
        this.coinSound = document.getElementById('coin-sound');
        
        // 控制按钮
        this.betButtons = document.querySelectorAll('.bet-btn');
        this.resetButton = document.getElementById('reset-btn');
        this.soundButton = document.getElementById('sound-btn');
        this.helpButton = document.getElementById('help-btn');
        this.shareButton = document.getElementById('share-btn');
        
        // 模态框
        this.helpModal = document.getElementById('help-modal');
        this.closeModalButton = this.helpModal.querySelector('.close-modal');
    }
    
    initEventListeners() {
        // 旋转按钮
        this.spinButton.addEventListener('click', () => this.spin());
        
        // 投注按钮
        this.betButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const bet = parseInt(e.target.dataset.bet);
                this.setBetAmount(bet);
            });
        });
        
        // 控制按钮
        this.resetButton.addEventListener('click', () => this.resetGame());
        this.soundButton.addEventListener('click', () => this.toggleSound());
        this.helpButton.addEventListener('click', () => this.showHelp());
        this.shareButton.addEventListener('click', () => this.shareGame());
        
        // 模态框
        this.closeModalButton.addEventListener('click', () => this.hideHelp());
        this.helpModal.addEventListener('click', (e) => {
            if (e.target === this.helpModal) this.hideHelp();
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                this.spin();
            }
            if (e.key === 'Escape' && this.helpModal.classList.contains('active')) {
                this.hideHelp();
            }
        });
    }
    
    initReels() {
        // 初始化三个转轮的符号
        this.createReelStrip(this.reel1);
        this.createReelStrip(this.reel2);
        this.createReelStrip(this.reel3);
    }
    
    createReelStrip(reelElement) {
        const strip = reelElement.querySelector('.reel-strip');
        strip.innerHTML = '';
        
        // 创建多个符号实例（确保有足够的符号用于滚动）
        for (let i = 0; i < 20; i++) {
            const symbol = this.getRandomSymbol();
            const symbolElement = document.createElement('div');
            symbolElement.className = 'symbol';
            symbolElement.innerHTML = symbol.emoji;
            symbolElement.dataset.name = symbol.name;
            symbolElement.dataset.multiplier = symbol.multiplier;
            strip.appendChild(symbolElement);
        }
    }
    
    getRandomSymbol() {
        // 加权随机 - 高倍率符号出现概率更低，低倍率符号更容易出现
        // 权重对应：樱桃🍒、柠檬🍋、橙子🍊、星星⭐、铃铛🔔、幸运7️⃣、老虎机🎰、皇冠👑
        const weights = [40, 30, 20, 15, 8, 4, 2, 1]; // 低倍率符号权重更高
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < this.symbols.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return this.symbols[i];
            }
        }
        
        return this.symbols[0]; // 默认返回第一个
    }
    
    setBetAmount(amount) {
        if (this.isSpinning) return;
        
        this.gameState.betAmount = amount;
        
        // 更新按钮状态
        this.betButtons.forEach(btn => {
            if (parseInt(btn.dataset.bet) === amount) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        this.saveGameState();
    }
    
    spin() {
        if (this.isSpinning) return;
        
        // 检查虚拟币是否足够
        if (this.gameState.coins < this.gameState.betAmount) {
            this.showMessage('虚拟币不足！请重置游戏或降低投注额。', 'error');
            return;
        }
        
        // 30%概率强制中奖（娱乐性质，增加中奖率）
        this.forcedWinSymbol = null;
        if (Math.random() < 0.3) { // 30%概率
            // 随机选择一个符号作为中奖符号（权重偏向低倍率符号）
            this.forcedWinSymbol = this.getRandomSymbol();
            console.log(`🎯 强制中奖激活！符号：${this.forcedWinSymbol.emoji} ${this.forcedWinSymbol.name}`);
        }
        
        // 扣除投注额
        this.gameState.coins -= this.gameState.betAmount;
        this.gameState.gamesPlayed++;
        
        // 开始旋转
        this.isSpinning = true;
        this.spinButton.classList.add('spinning');
        this.spinButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 旋转中...';
        
        // 播放音效
        if (this.gameState.soundEnabled) {
            this.spinSound.currentTime = 0;
            this.spinSound.play().catch(e => console.log('音效播放失败:', e));
        }
        
        // 旋转动画
        this.animateReels(() => {
            // 旋转完成，检查结果
            const results = this.getSpinResults();
            this.processResults(results);
            
            // 重置按钮状态
            this.isSpinning = false;
            this.spinButton.classList.remove('spinning');
            this.spinButton.innerHTML = '<i class="fas fa-play"></i> 开始旋转';
            
            // 保存游戏状态
            this.saveGameState();
            this.updateDisplay();
            
            // 检查成就
            this.checkAchievements();
        });
    }
    
    animateReels(callback) {
        const reels = [this.reel1, this.reel2, this.reel3];
        const durations = [3000, 3200, 3400]; // 每个转轮不同的持续时间
        
        let completed = 0;
        
        reels.forEach((reel, index) => {
            const strip = reel.querySelector('.reel-strip');
            const symbolHeight = 100; // 每个符号高度
            const randomOffset = Math.floor(Math.random() * 5) + 10; // 随机滚动距离
            
            // 重置位置
            strip.style.transition = 'none';
            strip.style.transform = 'translateY(0)';
            
            // 强制重绘
            void strip.offsetWidth;
            
            // 开始动画
            strip.style.transition = `transform ${durations[index]}ms cubic-bezier(0.2, 0.8, 0.3, 1)`;
            strip.style.transform = `translateY(-${randomOffset * symbolHeight}px)`;
            
            // 动画完成
            setTimeout(() => {
                completed++;
                if (completed === reels.length) {
                    setTimeout(callback, 500); // 额外延迟显示结果
                }
            }, durations[index]);
        });
    }
    
    getSpinResults() {
        const reels = [this.reel1, this.reel2, this.reel3];
        const results = [];
        
        // 如果这局强制中奖，返回相同的符号
        if (this.forcedWinSymbol) {
            console.log(`🎰 强制中奖模式：三个转轮都显示 ${this.forcedWinSymbol.emoji} ${this.forcedWinSymbol.name}`);
            for (let i = 0; i < 3; i++) {
                results.push({
                    emoji: this.forcedWinSymbol.emoji,
                    name: this.forcedWinSymbol.name,
                    multiplier: this.forcedWinSymbol.multiplier
                });
            }
            return results;
        }
        
        reels.forEach(reel => {
            const strip = reel.querySelector('.reel-strip');
            const computedStyle = window.getComputedStyle(strip);
            const matrix = new DOMMatrixReadOnly(computedStyle.transform);
            const translateY = matrix.m42;
            
            // 计算当前显示的符号（中间位置）
            // 每个符号高度100px，转轮高度300px，中间位置是第2个符号（索引1）
            // 但因为有滚动，需要计算实际位置
            const totalSymbols = strip.children.length; // 20个符号
            const symbolHeight = 100;
            
            // 计算当前中间位置的符号索引
            // translateY是负值，表示向上滚动了多少
            const scrollPosition = Math.abs(translateY);
            const middlePosition = scrollPosition + 150; // 转轮中间位置（150px）
            const symbolIndex = Math.floor(middlePosition / symbolHeight) % totalSymbols;
            
            const symbols = strip.querySelectorAll('.symbol');
            const currentSymbol = symbols[symbolIndex];
            
            // 调试信息
            console.log(`转轮结果: translateY=${translateY}, 符号=${currentSymbol.innerHTML}, 名称=${currentSymbol.dataset.name}`);
            
            results.push({
                emoji: currentSymbol.innerHTML,
                name: currentSymbol.dataset.name,
                multiplier: parseInt(currentSymbol.dataset.multiplier)
            });
        });
        
        return results;
    }
    
    processResults(results) {
        const [symbol1, symbol2, symbol3] = results;
        
        // 先隐藏所有中奖线
        this.hideAllPaylines();
        
        // 重置强制中奖符号（无论是否中奖）
        const wasForcedWin = this.forcedWinSymbol;
        this.forcedWinSymbol = null;
        
        // 检查是否中奖（三个符号相同）
        if (symbol1.name === symbol2.name && symbol2.name === symbol3.name) {
            // 中奖！
            const winAmount = this.gameState.betAmount * symbol1.multiplier;
            this.gameState.coins += winAmount;
            this.gameState.gamesWon++;
            this.gameState.winStreak++;
            this.gameState.totalWinnings += winAmount;
            
            // 更新最大中奖额
            if (winAmount > this.gameState.maxWin) {
                this.gameState.maxWin = winAmount;
            }
            
            // 更新最大连胜
            if (this.gameState.winStreak > this.gameState.maxStreak) {
                this.gameState.maxStreak = this.gameState.winStreak;
            }
            
            // 显示中奖线和信息
            this.showWinPaylines();
            
            // 如果是强制中奖，添加特殊提示
            if (wasForcedWin) {
                this.showWinMessage(symbol1, winAmount, true);
            } else {
                this.showWinMessage(symbol1, winAmount, false);
            }
            
            // 播放中奖音效
            if (this.gameState.soundEnabled) {
                this.winSound.currentTime = 0;
                this.winSound.play().catch(e => console.log('音效播放失败:', e));
                
                this.coinSound.currentTime = 0;
                this.coinSound.play().catch(e => console.log('音效播放失败:', e));
            }
        } else {
            // 未中奖
            this.gameState.winStreak = 0;
            this.showLoseMessage();
        }
    }
    
    hideAllPaylines() {
        const paylines = document.querySelectorAll('.payline');
        paylines.forEach(line => {
            line.classList.remove('active');
        });
    }
    
    showWinPaylines() {
        const paylines = document.querySelectorAll('.payline');
        paylines.forEach(line => {
            line.classList.add('active');
        });
        
        // 3秒后自动隐藏
        setTimeout(() => {
            this.hideAllPaylines();
        }, 3000);
    }
    
    showWinMessage(symbol, amount, isForcedWin = false) {
        let title = '🎉 恭喜中奖！';
        let extraInfo = '';
        
        if (isForcedWin) {
            title = '🎊 幸运降临！';
            extraInfo = '<div class="lucky-note">✨ 幸运加成 ✨</div>';
        }
        
        const resultHTML = `
            <div class="win-result">
                <div class="win-symbols">
                    <div class="win-symbol">${symbol.emoji}</div>
                    <div class="win-symbol">${symbol.emoji}</div>
                    <div class="win-symbol">${symbol.emoji}</div>
                </div>
                <div class="win-info">
                    <h4>${title}</h4>
                    <p>${symbol.name} x${symbol.multiplier}</p>
                    <div class="win-amount">+${amount} 虚拟币</div>
                    ${extraInfo}
                </div>
            </div>
        `;
        
        this.resultDisplay.innerHTML = resultHTML;
        this.lastWin.innerHTML = `最近中奖：${symbol.name} x${symbol.multiplier} (+${amount})${isForcedWin ? ' 🍀' : ''}`;
        
        // 添加庆祝动画
        this.resultDisplay.classList.add('celebrating');
        setTimeout(() => {
            this.resultDisplay.classList.remove('celebrating');
        }, 2000);
    }
    
    showLoseMessage() {
        this.resultDisplay.innerHTML = `
            <div class="lose-result">
                <div class="lose-icon">😢</div>
                <div class="lose-info">
                    <h4>未中奖</h4>
                    <p>下次好运！</p>
                </div>
            </div>
        `;
        
        this.lastWin.innerHTML = '最近中奖：无';
    }
    
    showMessage(text, type = 'info') {
        // 简单的消息提示
        alert(text); // 在实际项目中可以使用更优雅的提示方式
    }
    
    checkAchievements() {
        const newAchievements = [];
        
        // 检查各个成就条件
        if (!this.gameState.achievements.first_win && this.gameState.gamesWon >= 1) {
            this.gameState.achievements.first_win = true;
            newAchievements.push(this.achievementsList[0]);
        }
        
        if (!this.gameState.achievements.big_winner && this.gameState.maxWin >= 500) {
            this.gameState.achievements.big_winner = true;
            newAchievements.push(this.achievementsList[1]);
        }
        
        if (!this.gameState.achievements.streak_master && this.gameState.maxStreak >= 5) {
            this.gameState.achievements.streak_master = true;
            newAchievements.push(this.achievementsList[2]);
        }
        
        if (!this.gameState.achievements.veteran && this.gameState.gamesPlayed >= 50) {
            this.gameState.achievements.veteran = true;
            newAchievements.push(this.achievementsList[3]);
        }
        
        // 检查头奖成就（中得最高倍数30倍）
        if (!this.gameState.achievements.jackpot) {
            // 这里简化处理：如果最大中奖额达到投注额的30倍，则解锁
            if (this.gameState.maxWin >= this.gameState.betAmount * 30) {
                this.gameState.achievements.jackpot = true;
                newAchievements.push(this.achievementsList[4]);
            }
        }
        
        // 检查收藏家成就（所有其他成就都解锁）
        if (!this.gameState.achievements.collector) {
            const allUnlocked = ['first_win', 'big_winner', 'streak_master', 'veteran', 'jackpot']
                .every(id => this.gameState.achievements[id]);
            if (allUnlocked) {
                this.gameState.achievements.collector = true;
                newAchievements.push(this.achievementsList[5]);
            }
        }
        
        // 如果有新成就，显示通知
        if (newAchievements.length > 0) {
            this.showAchievementNotification(newAchievements);
        }
        
        this.updateAchievementsDisplay();
    }
    
    showAchievementNotification(achievements) {
        achievements.forEach(achievement => {
            const notification = document.createElement('div');
            notification.className = 'achievement-notification';
            notification.innerHTML = `
                <div class="notification-icon">${achievement.icon}</div>
                <div class="notification-content">
                    <div class="notification-title">成就解锁！</div>
                    <div class="notification-desc">${achievement.name}</div>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            // 自动移除
            setTimeout(() => {
                notification.remove();
            }, 3000);
        });
    }
    
    updateAchievementsDisplay() {
        this.achievementsGrid.innerHTML = '';
        
        this.achievementsList.forEach(achievement => {
            const isUnlocked = this.gameState.achievements[achievement.id] || false;
            
            const achievementElement = document.createElement('div');
            achievementElement.className = `achievement ${isUnlocked ? 'unlocked' : 'locked'}`;
            achievementElement.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.desc}</div>
                <div class="achievement-points">${achievement.points}点</div>
            `;
            
            this.achievementsGrid.appendChild(achievementElement);
        });
        
        // 计算成就点数
        const totalPoints = this.achievementsList.reduce((total, achievement) => {
            return total + (this.gameState.achievements[achievement.id] ? achievement.points : 0);
        }, 0);
        
        this.achievementPointsElement.textContent = totalPoints;
    }
    
    updateDisplay() {
        // 更新虚拟币显示
        this.coinCount.textContent = this.gameState.coins;
        this.currentCoins.textContent = this.gameState.coins;
        
        // 更新游戏统计
        this.winStreakElement.textContent = this.gameState.winStreak;
        this.gamesPlayedElement.textContent = this.gameState.gamesPlayed;
        
        // 计算胜率
        const winRate = this.gameState.gamesPlayed > 0 
            ? Math.round((this.gameState.gamesWon / this.gameState.gamesPlayed) * 100) 
            : 0;
        this.winRate.textContent = `${winRate}%`;
        
        // 更新其他统计
        this.playTimeElement.textContent = `${this.gameState.playTime}分钟`;
        this.maxWinElement.textContent = this.gameState.maxWin;
        this.maxStreakElement.textContent = this.gameState.maxStreak;
        
        // 更新奖池显示（简单递增）
        const jackpotValue = 5000 + Math.floor(this.gameState.totalWinnings / 10);
        this.jackpot.textContent = jackpotValue;
    }
    
    loadGameState() {
        try {
            const saved = localStorage.getItem('slotMachineGameState');
            if (saved) {
                const parsed = JSON.parse(saved);
                // 合并保存的状态，保留新添加的属性
                this.gameState = { ...this.gameState, ...parsed };
            }
        } catch (e) {
            console.log('加载游戏状态失败:', e);
        }
    }
    
    saveGameState() {
        try {
            localStorage.setItem('slotMachineGameState', JSON.stringify(this.gameState));
        } catch (e) {
            console.log('保存游戏状态失败:', e);
        }
    }
    
    startPlayTimer() {
        this.playTimer = setInterval(() => {
            this.gameState.playTime++;
            this.saveGameState();
            this.updateDisplay();
        }, 60000); // 每分钟更新一次
    }
    
    resetGame() {
        if (confirm('确定要重置游戏吗？所有进度将丢失，虚拟币将重置为1000。')) {
            this.gameState = {
                coins: 1000,
                betAmount: 100,
                gamesPlayed: 0,
                gamesWon: 0,
                winStreak: 0,
                maxStreak: 0,
                totalWinnings: 0,
                maxWin: 0,
                playTime: 0,
                achievements: {},
                soundEnabled: this.gameState.soundEnabled
            };
            
            this.saveGameState();
            this.updateDisplay();
            this.updateAchievementsDisplay();
            
            // 重置按钮状态
            this.setBetAmount(100);
            
            this.showMessage('游戏已重置！虚拟币恢复为1000。', 'info');
        }
    }
    
    toggleSound() {
        this.gameState.soundEnabled = !this.gameState.soundEnabled;
        this.soundButton.classList.toggle('active', this.gameState.soundEnabled);
        
        if (this.gameState.soundEnabled) {
            this.soundButton.innerHTML = '<i class="fas fa-volume-up"></i> 音效';
        } else {
            this.soundButton.innerHTML = '<i class="fas fa-volume-mute"></i> 音效';
        }
        
        this.saveGameState();
        this.showMessage(`音效已${this.gameState.soundEnabled ? '开启' : '关闭'}`, 'info');
    }
    
    showHelp() {
        this.helpModal.classList.add('active');
    }
    
    hideHelp() {
        this.helpModal.classList.remove('active');
    }
    
    shareGame() {
        const shareText = `🎰 我在玩「马铃薯头娱乐老虎机」游戏！这是一个纯娱乐的老虎机游戏，无赌博性质，快来试试吧！\n游戏地址：${window.location.href}`;
        
        if (navigator.share) {
            navigator.share({
                title: '马铃薯头娱乐老虎机',
                text: shareText,
                url: window.location.href
            }).catch(e => console.log('分享失败:', e));
        } else {
            // 复制到剪贴板
            navigator.clipboard.writeText(shareText).then(() => {
                this.showMessage('游戏链接已复制到剪贴板！快去分享给朋友吧！', 'info');
            }).catch(e => {
                this.showMessage(`分享文本：${shareText}`, 'info');
            });
        }
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    const game = new SlotMachineGame();
    console.log('🎰 马铃薯头娱乐老虎机游戏已加载完成！');
    
    // 添加一些CSS样式
    const style = document.createElement('style');
    style.textContent = `
        .win-result {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            animation: celebrate 1s ease;
        }
        
        .win-symbols {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .win-symbol {
            font-size: 3rem;
            animation: bounce 0.5s ease infinite alternate;
        }
        
        .win-symbol:nth-child(2) {
            animation-delay: 0.2s;
        }
        
        .win-symbol:nth-child(3) {
            animation-delay: 0.4s;
        }
        
        .win-info h4 {
            color: #FFD700;
            margin-bottom: 10px;
            font-size: 1.5rem;
        }
        
        .win-amount {
            font-size: 2rem;
            font-weight: bold;
            color: #4ade80;
            margin-top: 10px;
        }
        
        .lose-result {
            text-align: center;
            padding: 30px;
        }
        
        .lose-icon {
            font-size: 4rem;
            margin-bottom: 20px;
            opacity: 0.7;
        }
        
        .achievement-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 15px;
            z-index: 1000;
            animation: slideIn 0.5s ease, slideOut 0.5s ease 2.5s forwards;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        
        .notification-icon {
            font-size: 2rem;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        @keyframes celebrate {
            0% { transform: scale(0.8); opacity: 0; }
            70% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes bounce {
            from { transform: translateY(0); }
            to { transform: translateY(-10px); }
        }
        
        .celebrating {
            animation: pulseGold 0.5s ease infinite alternate;
        }
        
        @keyframes pulseGold {
            from { box-shadow: 0 0 10px rgba(255, 215, 0, 0.5); }
            to { box-shadow: 0 0 30px rgba(255, 215, 0, 0.8); }
        }
    `;
    document.head.appendChild(style);
});