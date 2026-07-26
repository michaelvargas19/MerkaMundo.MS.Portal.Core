var environmentName = 'prod';
var URL_CORE = 'https://192.168.0.5:15000';
var VERSION = require( 'package.json').version;
var DELIVERY = require( 'package.json').deliveryDate;


export const environment={
  URL_CORE: URL_CORE,
  VERSION: VERSION,
  DELIVERY: DELIVERY,
  ENVIRONMENT: environmentName
  
};