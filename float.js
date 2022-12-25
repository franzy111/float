const fs = require('fs');
let arg = process.argv;
let res = '';
let inpStr = fs.readFileSync(arg[2], 'utf-8');
let str = inpStr.split(' ');
let exponent;

function Binary(entire) {
    let bin = entire.toString(2);
    return bin;
}
function tmpBin(num, length) {
    let flag = false;
    let tmpbin = '';
    if (length > 0)
        flag = true;
    if (num) {
        for (let i = 0; i < 24 - length; i++) {
            if (Math.floor(num * 2) === 1)
                flag = true
            if (flag)
                tmpbin += Math.floor(num * 2);
            else {
                i--;
                exponent--;
            }
            num = Number('0.' + String(num * 2).split('.')[1]);
            if (isNaN(num))
                break;
        }
    } else
        tmpbin = '0'.repeat(24 - length);
    tmpbin += '0'.repeat(24 - length - tmpbin.length);
    return tmpbin;
}

function Float(sign, binExp, bin, tmpbin) {
    let float = sign + '0'.repeat(8 - binExp.length) + binExp;
    if (bin > 0)
        float += bin.slice(1, bin.length) + tmpbin;
    else
        float += tmpbin.slice(1, tmpbin.length);
    return float;
}

let infinity = '0' + '1'.repeat(8) + '0'.repeat(23);
let min_infinity = '1'.repeat(9) + '0'.repeat(23);
let NaN = '0' + '1'.repeat(9) + '0'.repeat(22);
let exponents = new Array();

function reform(num) {
    let sign = 0;
    if (num < 0)
        sign = 1;
    if (num > ((2 - 2 ** -23) * 2 ** 127) || num === Infinity)
        return infinity;
    else if (num < (-(2 - 2 ** -23) * 2 ** 127) || num === -Infinity)
        return min_infinity;
    else if (isNaN(num))
        return NaN;
    num = Math.abs(num);
    let floor = Math.floor(num);
    let tmp = 0;
    if (num !== floor)
        tmp = Number('0.' + String(num).split('.')[1]);
    let bin = Binary(floor);
    let binLength = bin.length;
    if (binLength > 0)
        exponent = binLength - 1;
    else
        exponent = -1;

    let tmpbin = tmpBin(tmp, binLength);
    let binExp = Binary(exponent + 127);
    let float = Float(sign, binExp, bin, tmpbin);
    exponents.push(exponent);
    return float;
}

function Exp(binExp) {
    let exp = 0;
    let deg = 1;
    for (let i = binExp.length - 1; i >= 0; i--) {
        exp += Number(binExp[i]) * deg;
        deg *= 2;
    }
    exp -= 127
    return exp;
}

function Float2(conv) {
    let sign = conv[0];
    let binExponent = conv.slice(1, 9);
    let binMantissa = conv.slice(9, 32);
    let mantissa = 0;
    let exponent = Exp(binExponent);
    let deg = 0.5;
    for (let i = 0; i < binMantissa.length; i++) {
        mantissa += Number(binMantissa[i]) * deg;
        deg *= 0.5
    }
    return (1 + mantissa) * 2 ** exponent * (-1) ** sign;
}

function align(first, second) {
    let diff = exponents[0] - exponents[1];
    second = first.slice(0, 9) + '0'.repeat(diff - 1) + '1' + second.slice(9, 32 - diff);
    return second
}

function add(first, second) {
    let incrt = 1;
    let sum = '';
    let j = 30;
    if (first.slice(1, 9) !== second.slice(1, 9)) {
        j = 31;
        incrt = 0;
        second = align(first, second);
    }
    let d = 0;
    for (let i = j; i >= j - 22; i--) {
        let summa = Number(first[i]) + Number(second[i]);
        sum = String((summa + d) % 2) + sum;
        d = Math.floor((summa + d) / 2);
    }
    if (d >= 1) {
        if (incrt !== 1)
            sum = '0' + sum.slice(0, 22);
        incrt++;
    }
    if (incrt >= 1)
        return first[0] + Binary(Exp(first.slice(1, 9)) + 128) + sum;
    return first.slice(0, 9) + sum;
}

function sub(first, second) {
    let incrt = -1;
    let diff = '';
    if (first.slice(1, 9) !== second.slice(1, 9)) {
        second = align(first, second);
        incrt = 0;
    }
    let d = 0;
    for (let i = 31; i >= 9; i--) {
        let differ = Number(first[i]) - Number(second[i]);
        diff = String((Math.abs(differ - d)) % 2) + diff;
        if (differ + d >= 0)
            d = 0
        else
            d = -1
    }
    if (incrt === -1 || (incrt === 0 && d === -1)) {
        let j = 0;
        while (diff[j] === '0') {
            incrt--;
            j++;
        }
        if (d === -1) {
            incrt--;
            j++;
        }
        if (exponents[0] === exponents[1])
            j++;
        diff = diff.slice(j, 31) + '0'.repeat(j);
    }
    let tmpExp = Binary(Exp(first.slice(1, 9)) + 127 + incrt);
    let sign;
    if (str[0] > str[2])
        sign = '0';
    else
        sign = '1';
    return sign + '0'.repeat(8 - tmpExp.length) + tmpExp + diff;
}
if (arg[3] === 'calc'){
    if (str[1] === '-')
        str[2] *= -1;
    if (Math.abs(parseFloat(str[0])) < Math.abs(parseFloat(str[2]))){
        [str[0], str[2]] = [str[2], str[0]];
        if (str[2] > 0 && str[1] === '-')
            str[1] = '+';
    }
    let first = reform(Number(str[0]));
    str[0] = String(str[0]);
    let second = reform(Number(str[2]));
    let ans;
    if ((str[0][0] === str[1]) || (str[1] === '+' && str[0][0] !== '-' && str[2][0] !== '-')){
        ans = add(first, second);
        res += ans + '\n';
    }
    else{
        ans = sub(first, second);
        res += ans + '\n';
    }
    res += String(Float2(ans));
    console.log(res);
}else if (arg[3] === 'conv'){
    res = reform(Number(str));
    console.log(res);
}
