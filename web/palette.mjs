export const HEX=Object.freeze({sky:'#0E1430',fog:'#1B2350',grass:'#2F5D50',sand:'#C9B48A',wood:'#6B4A2F',sea:'#12384A',lamp:'#FFB347',core:'#FFE9B0',unlit:'#5B5F6E',mote:'#FFF6C2',halo:'#FFE58A',shade:'#120A1A',rim:'#7A3CFF',stunned:'#3A3450',coat:'#E8E2D0',red:'#C8102E',gold:'#F2C14E',drifter:'#8FA3B8',danger:'#FF5A5F',text:'#F5F1E6'});
export const C=Object.fromEntries(Object.entries(HEX).map(([k,h])=>[k,[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255)]));
export const ACCESSIBLE=Object.freeze({rim:'#00B3FF',danger:'#FFFFFF'});
export const ACCESSIBLE_RIM=[0,179/255,1];
