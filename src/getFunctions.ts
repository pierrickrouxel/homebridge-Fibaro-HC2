//    Copyright 2017 ilcato
// 
//    Licensed under the Apache License, Version 2.0 (the "License");
//    you may not use this file except in compliance with the License.
//    You may obtain a copy of the License at
// 
//        http://www.apache.org/licenses/LICENSE-2.0
// 
//    Unless required by applicable law or agreed to in writing, software
//    distributed under the License is distributed on an "AS IS" BASIS,
//    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//    See the License for the specific language governing permissions and
//    limitations under the License.

// Fibaro Home Center 2 Platform plugin for HomeBridge

'use strict'

export class GetFunctions {
	hapCharacteristic: any;
	getFunctionsMapping: Map<string, any>;
	getCurrentSecuritySystemStateMapping: Map<string, any>;
	getTargetSecuritySystemStateMapping: Map<string, any>;
	platform: any;
	
	constructor(hapCharacteristic, platform) {
		this.hapCharacteristic = hapCharacteristic;
		this.platform = platform;
		
		this.getFunctionsMapping = new Map([
			[(new hapCharacteristic.On()).UUID, 						this.getBool],
			[(new hapCharacteristic.Brightness()).UUID, 				this.getBrightness],
			[(new hapCharacteristic.PositionState()).UUID, 				this.getPositionState],
			[(new hapCharacteristic.CurrentPosition()).UUID, 			this.getCurrentPosition],
			[(new hapCharacteristic.TargetPosition()).UUID, 			this.getCurrentPosition], 				// Manage the same as currentPosition
			[(new hapCharacteristic.MotionDetected()).UUID, 			this.getBool],
			[(new hapCharacteristic.CurrentTemperature()).UUID, 		this.getFloat],
			[(new hapCharacteristic.TargetTemperature()).UUID, 			this.getTargetTemperature],
			[(new hapCharacteristic.CurrentRelativeHumidity()).UUID, 	this.getFloat],
			[(new hapCharacteristic.ContactSensorState()).UUID, 		this.getContactSensorState],
			[(new hapCharacteristic.LeakDetected()).UUID, 				this.getLeakDetected],
			[(new hapCharacteristic.SmokeDetected()).UUID, 				this.getSmokeDetected],
			[(new hapCharacteristic.CurrentAmbientLightLevel()).UUID, 	this.getFloat],
			[(new hapCharacteristic.OutletInUse()).UUID, 				this.getOutletInUse],
			[(new hapCharacteristic.LockCurrentState()).UUID, 			this.getLockCurrentState],
			[(new hapCharacteristic.LockTargetState()).UUID, 			this.getLockCurrentState], 				// Manage the same as currentState
			[(new hapCharacteristic.CurrentHeatingCoolingState()).UUID, this.getCurrentHeatingCoolingState], 
			[(new hapCharacteristic.TargetHeatingCoolingState()).UUID, 	this.getCurrentHeatingCoolingState], 	// Manage the same as currentState
			[(new hapCharacteristic.TemperatureDisplayUnits()).UUID, 	this.getTemperatureDisplayUnits],
			[(new hapCharacteristic.Hue()).UUID, 						this.getHue],
			[(new hapCharacteristic.Saturation()).UUID, 				this.getSaturation]
		]);
		this.getCurrentSecuritySystemStateMapping = new Map([
			["AwayArmed", 	this.hapCharacteristic.SecuritySystemCurrentState.AWAY_ARM],
			["Disarmed", 	this.hapCharacteristic.SecuritySystemCurrentState.DISARMED],
			["NightArmed", 	this.hapCharacteristic.SecuritySystemCurrentState.NIGHT_ARM],
			["StayArmed", 	this.hapCharacteristic.SecuritySystemCurrentState.STAY_ARM],
			["AlarmTriggered", this.hapCharacteristic.SecuritySystemCurrentState.ALARM_TRIGGERED]
		]);
		this.getTargetSecuritySystemStateMapping = new Map([
			["AwayArmed", 	this.hapCharacteristic.SecuritySystemTargetState.AWAY_ARM],
			["Disarmed", 	this.hapCharacteristic.SecuritySystemTargetState.DISARM],
			["NightArmed", 	this.hapCharacteristic.SecuritySystemTargetState.NIGHT_ARM],
			["StayArmed", 	this.hapCharacteristic.SecuritySystemTargetState.STAY_ARM]
		]);
	}

	returnValue(r, callback, characteristic) {
		if (callback)
			callback(undefined, r);
		else
			characteristic.setValue(r, undefined, 'fromFibaro');
	}
	// Boolean getter
	getBool(callback, characteristic, service, IDs, properties) { 
		let v = properties.value;
		let r = (v == "true" || v == "false") ?
			((v == "false") ? false : true)   :
			((parseInt(v) == 0) ? false : true);
		this.returnValue(r, callback, characteristic);
	}
	// Float getter
	getFloat(callback, characteristic, service, IDs, properties) {
		let r = parseFloat(properties.value);
		this.returnValue(r, callback, characteristic);
	}
	getBrightness(callback, characteristic, service, IDs, properties) {
		if (service.HSBValue != null) {
			let hsv = this.updateHomeKitColorFromHomeCenter(properties.color, service);
			if (callback) callback(undefined, Math.round(hsv.v));
		} else {
			if (properties.value == 99) properties.value = 100;
			let r = parseFloat(properties.value);
			this.returnValue(r, callback, characteristic);
		}
	}
	getPositionState(callback, characteristic, service, IDs, properties) {
		if (callback) callback(undefined, this.hapCharacteristic.PositionState.STOPPED);
	}
	getCurrentPosition(callback, characteristic, service, IDs, properties) {
		let r = parseInt(properties.value);
		if (r >= characteristic.props.minValue && r <= characteristic.props.maxValue) {
			if (r == 99) r = 100;
			this.returnValue(r, callback, characteristic);
		} else {
			if (callback) callback("Error value window position", null);
		}
	}
	getTargetTemperature(callback, characteristic, service, IDs, properties) {
		let r = parseFloat(properties.targetLevel);
		this.returnValue(r, callback, characteristic);
	}
	getContactSensorState(callback, characteristic, service, IDs, properties) {
		let r = properties.value == "false" ? this.hapCharacteristic.ContactSensorState.CONTACT_DETECTED : this.hapCharacteristic.ContactSensorState.CONTACT_NOT_DETECTED;
		this.returnValue(r, callback, characteristic);
	}
	getLeakDetected(callback, characteristic, service, IDs, properties) {
		let r = properties.value == "true" ? this.hapCharacteristic.LeakDetected.LEAK_DETECTED : this.hapCharacteristic.LeakDetected.LEAK_NOT_DETECTED;
		this.returnValue(r, callback, characteristic);
	}
	getSmokeDetected(callback, characteristic, service, IDs, properties) {
		let r = properties.value == "true" ? this.hapCharacteristic.SmokeDetected.SMOKE_DETECTED : this.hapCharacteristic.SmokeDetected.SMOKE_NOT_DETECTED;
		this.returnValue(r, callback, characteristic);
	}
	getOutletInUse(callback, characteristic, service, IDs, properties) {
		let r = parseFloat(properties.power) > 1.0 ? true : false;
		this.returnValue(r, callback, characteristic);
	}
	getLockCurrentState(callback, characteristic, service, IDs, properties) {
		let r = properties.value == "true" ? this.hapCharacteristic.LockCurrentState.SECURED : this.hapCharacteristic.LockCurrentState.UNSECURED;
		this.returnValue(r, callback, characteristic);
	}
	getCurrentHeatingCoolingState(callback, characteristic, service, IDs, properties) {
		if (callback) callback(undefined, this.hapCharacteristic.TargetHeatingCoolingState.HEAT);
	}
	getTemperatureDisplayUnits(callback, characteristic, service, IDs, properties) {
		if (callback) callback(undefined, this.hapCharacteristic.TemperatureDisplayUnits.CELSIUS);
	}
	getHue(callback, characteristic, service, IDs, properties) {
		let hsv = this.updateHomeKitColorFromHomeCenter(properties.color, service);
		if (callback) callback(undefined, Math.round(hsv.h));
	}
	getSaturation(callback, characteristic, service, IDs, properties) {
		let hsv = this.updateHomeKitColorFromHomeCenter(properties.color, service);
		if (callback) callback(undefined, Math.round(hsv.s));
	}
	getSecuritySystemTargetState(callback, characteristic, service, IDs, securitySystemStatus) {
		let state;
		if (characteristic.UUID == (new this.hapCharacteristic.SecuritySystemCurrentState()).UUID) {
			state = this.getCurrentSecuritySystemStateMapping.get(securitySystemStatus.value);
		} else if (characteristic.UUID == (new this.hapCharacteristic.SecuritySystemTargetState()).UUID) {
			state = this.getTargetSecuritySystemStateMapping.get(securitySystemStatus.value);
		}
		if (state == undefined)
			state = this.hapCharacteristic.SecuritySystemTargetState.DISARMED;
		callback(undefined, state);
	}

	updateHomeKitColorFromHomeCenter(color, service) {
		let colors = color.split(",");
		let r = parseInt(colors[0]);
		let g = parseInt(colors[1]);
		let b = parseInt(colors[2]);
		service.RGBValue.red = r;
		service.RGBValue.green = g;
		service.RGBValue.blue = b;
		let hsv = this.RGBtoHSV(r, g, b);
		service.HSBValue.hue = hsv.h;
		service.HSBValue.saturation = hsv.s;
		service.HSBValue.brightness = hsv.v;
		return hsv;  	
	}
	RGBtoHSV(r, g, b) {
		if (arguments.length === 1) {
			g = r.g, b = r.b, r = r.r;
		}
		var max = Math.max(r, g, b), min = Math.min(r, g, b),
			d = max - min,
			h,
			s = (max === 0 ? 0 : d / max),
			v = max / 255;

		switch (max) {
			case min: h = 0; break;
			case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
			case g: h = (b - r) + d * 2; h /= 6 * d; break;
			case b: h = (r - g) + d * 4; h /= 6 * d; break;
		}

		return {
			h: h * 360.0,
			s: s * 100.0,
			v: v * 100.0
		};
	}
}
