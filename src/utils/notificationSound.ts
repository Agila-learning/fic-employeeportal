// Notification sound utility
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

export const playNotificationSound = (type: 'info' | 'warning' | 'success' = 'info') => {
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different frequencies for different notification types
    const frequencies = {
      info: [523, 659], // C5, E5
      warning: [392, 523, 392], // G4, C5, G4
      success: [523, 659, 784], // C5, E5, G5
    };
    
    const freqs = frequencies[type];
    const duration = 0.15;
    const startTime = audioContext.currentTime;
    
    freqs.forEach((freq, index) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.frequency.value = freq;
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0.15, startTime + index * duration);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + (index + 1) * duration);
      
      osc.start(startTime + index * duration);
      osc.stop(startTime + (index + 1) * duration);
    });
  } catch (error) {
    console.log('Audio not available');
  }
};
