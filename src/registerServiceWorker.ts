import { registerSW } from 'virtual:pwa-register';

export const updateSW = registerSW({
  onNeedRefresh() {
    console.log('Nouvelle version disponible !');
  },
  onOfflineReady() {
    console.log('App prête à fonctionner hors ligne');
  }
});
