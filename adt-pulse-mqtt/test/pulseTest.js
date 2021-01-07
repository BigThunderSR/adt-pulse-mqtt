'use strict';

const chai  = require('chai');
const spies  = require('chai-spies');
const rewire = require('rewire');
const nock = require('nock');
const fs = require('fs');

// Set up chai, plugins
chai.use(spies);
let expect = chai.expect;

// Rewire adt-pulse module
let pulse = rewire('../adt-pulse.js');

describe('ADT Pulse Initialization Test',function() {
  // Setup
  let testAlarm = new pulse("test","password");

  // Evaluate
  it("Should return an object instance", () => expect(testAlarm).be.an.instanceOf(pulse));
  it("Should have an authenticated property", () => expect(testAlarm).to.have.property("authenticated"));
  it("Should have a Clients property", () => expect(testAlarm).to.have.property("clients"));
  it("Should have a 0 length array in Clients property", () => expect(testAlarm.clients).has.lengthOf(0));
  it("Should have a Config property set", () => expect(testAlarm).to.have.property("config"));
  it("Should have a username of test", () => expect(testAlarm.config["username"]).is.equals("test"));
  it("Should have a password of password", () => expect(testAlarm.config["password"]).is.equals("password"));

  // Add config properties as they are used
  it("Should have baseUrl set", () => expect(testAlarm.config).to.have.property("baseUrl"));
  it("Should have baseUrl set to https://portal.adtpulse.com",  () => expect(testAlarm.config.baseUrl).equals("https://portal.adtpulse.com"));
  it("Should have prefix set", () => expect(testAlarm.config).to.have.property("prefix"));
  it("Should have initialURI property set", () => expect(testAlarm.config).to.have.property("initialURI"));
  it("Should have initialURI set to /",  () => expect(testAlarm.config.initialURI).equals("/"));
  it("Should have authURI property set", () => expect(testAlarm.config).to.have.property("authURI"));
  it("Should have authURI set to /access/signin.jsp?e=n&e=n&&partner=adt",  () => expect(testAlarm.config.authURI).equals("/access/signin.jsp?e=n&e=n&&partner=adt"));
  it("Should have summaryURI property set", () => expect(testAlarm.config).to.have.property("summaryURI"));
  it("Should have summaryURI set to /summary/summary.jsp",  () => expect(testAlarm.config.summaryURI).equals("/summary/summary.jsp"));

  describe('ADT Pulse Login Successful Test', function() { 
    // Setup

      nock("https://portal.adtpulse.com")
      .get('/')
      .reply(302,"<html></html>", {"Location":"https://portal.adtpulse.com/myhome/20.0.0-233/access/signin.jsp"})
      .get('/myhome/20.0.0-233/access/signin.jsp')
      .reply(200, ()=> {
        try {  
          var page = fs.readFileSync('./test/pages/signin.jsp', 'utf8');
          return page.toString();    
        } catch(e) {
          console.log('Error:', e.stack);
        }
      })
      .post('/myhome/20.0.0-233/access/signin.jsp', {
        username: 'test',
        password: 'password',
      })
      .query(true)
      .reply(301,"<html></html>", {"Location":"https://portal.adtpulse.com/myhome/20.0.0-233/summary/summary.jsp"})
      .get('/myhome/20.0.0-233/summary/summary.jsp')
      .reply(200,"<html></html>");
      
      testAlarm.login().then(it("Should set Uripart", function() {
        expect(testAlarm.config.prefix).equals("/myhome/20.0.0-233");
      }));
  });

  // Clean up
  clearInterval(testAlarm.pulseInterval); // Stop executing sync
});