// service.js
const Service = require('node-windows').Service;
const path = require('path');

const appFilePath = path.resolve(path.join(__dirname, 'app.js'));

const svc = new Service({
    name: 'GrafanaAsoc',
    description: 'Interface to integrate Grafana and AppScan',
    script: appFilePath,
});

// Handle uninstallation
if (process.argv[2] === 'uninstall') {
    svc.uninstall();
    console.log('Service uninstalled successfully');
} else {
    // Install the service
    svc.install();

    svc.on('install', () => {
        console.log('Service installed successfully');
        // Start the service if needed
        svc.start();
    });
}
