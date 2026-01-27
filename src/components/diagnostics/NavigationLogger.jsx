// Simple in-memory navigation event logger
class NavigationLogger {
  constructor() {
    this.events = [];
    this.maxEvents = 50;
  }

  log(from, to) {
    this.events.push({
      from,
      to,
      timestamp: new Date().toISOString(),
    });
    
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }

  getRecent(count = 10) {
    return this.events.slice(-count);
  }

  clear() {
    this.events = [];
  }

  getAll() {
    return [...this.events];
  }
}

export const navigationLogger = new NavigationLogger();