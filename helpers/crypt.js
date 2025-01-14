/* JavaScript crypt() password hash generator.
 *
 * Copyright (c) 2004, 2016 Emil Mikulic. https://unix4lyfe.org/
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the author nor the names of other contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

const ascii64 =
    './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

var /** !HTMLInputElement */ _pw;
var /** !HTMLInputElement */ _pw2;
var /** !HTMLSpanElement */ _msg;
var /** !HTMLInputElement */ _dessalt;
var /** !HTMLInputElement */ _md5salt;
var /** !HTMLSpanElement */ _deshash;
var /** !HTMLSpanElement */ _md5hash;

/**
 * Generate random ascii64 salt.
 * @param {number} length
 * @return {string}
 */
function random_salt(length) {
    var salt = '';
    for (var i=0; i<length; i++)
        salt += ascii64.charAt( Math.floor(64 * Math.random()) );
    return salt;
}

/** - */
function randomize_des_salt() { _dessalt.value = random_salt(2); }

/** - */
function randomize_md5_salt() { _md5salt.value = random_salt(8); }

/** - */
function onload() {
    // Explicit casts to make closure compiler happy.
    _pw = /** @type {!HTMLInputElement} */ (document.getElementById('pw'));
    _pw2 = /** @type {!HTMLInputElement} */ (document.getElementById('pw2'));
    _dessalt = /** @type {!HTMLInputElement} */ (
        document.getElementById('dessalt'));
    _md5salt = /** @type {!HTMLInputElement} */ (
        document.getElementById('md5salt'));
    _msg = /** @type {!HTMLSpanElement} */ (document.getElementById('msg'));
    _deshash = /** @type {!HTMLSpanElement} */ (
        document.getElementById('deshash'));
    _md5hash = /** @type {!HTMLSpanElement} */ (
        document.getElementById('md5hash'));
    randomize_des_salt();
    randomize_md5_salt();
    des_init();
    validate_pwd();
}

/** - */
function calc_md5() {
    _md5hash.innerText = md5crypt(_pw.value, _md5salt.value);
}

/** - */
function calc_des() {
    _deshash.innerText = descrypt(_pw.value, _dessalt.value);
}

/** - */
function validate_pwd() {
    var empty = (_pw.value === '');
    var match = (_pw.value === _pw2.value) && !empty;

    document.getElementById("btndes").disabled =
        document.getElementById("btnmd5").disabled = !match;

    if (empty) {
        _msg.innerText = "Enter a password to hash.";
    } else if (!match) {
        _msg.innerText = "Passwords do not match.";
    } else {
        _msg.innerText = "Passwords match.";
    }
}

/** md5crypt() adapted from:
 * $OpenBSD: md5crypt.c,v 1.13 2003/08/07 00:30:21 deraadt Exp $
 * $FreeBSD: crypt.c,v 1.5 1996/10/14 08:34:02 phk Exp $
 * Original license:
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <phk@login.dknet.dk> wrote this file.  As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return.   Poul-Henning Kamp
 * ----------------------------------------------------------------------------
 *
 * @param {string} password
 * @param {string} salt
 * @return {string}
 */
function md5crypt(password, salt) {
    var ctx = password+"$1$"+salt;
    var ctx1 = str_md5(password+salt+password);

    /* "Just as many characters of ctx1" (as there are in the password) */
    for (var pl=password.length; pl>0; pl -= 16)
        ctx += ctx1.slice(0, (pl > 16) ? 16 : pl);

    /* "Then something really weird" */
    for (var i=password.length; i != 0; i >>= 1)
        if (i & 1)
            ctx += "\0";
        else
            ctx += password.charAt(0);

    ctx = str_md5(ctx);

    /* "Just to make sure things don't run too fast" */
    for (i=0; i<1000; i++) {
        ctx1 = "";
        if (i & 1) ctx1 += password;
        else ctx1 += ctx;

        if (i % 3) ctx1 += salt;

        if (i % 7) ctx1 += password;

        if (i & 1) ctx1 += ctx;
        else ctx1 += password;

        ctx = str_md5(ctx1);
    }

    return "$1$" + salt + "$" +
        to64_triplet(ctx, 0,  6, 12) +
        to64_triplet(ctx, 1,  7, 13) +
        to64_triplet(ctx, 2,  8, 14) +
        to64_triplet(ctx, 3,  9, 15) +
        to64_triplet(ctx, 4, 10,  5) +
        to64_single(ctx, 11);
}

/**
 * @param {number} v
 * @param {number} n
 * @return {string}
 */
function to64(v, n) {
    var s = '';
    while (--n >= 0) {
        s += ascii64.charAt( v & 0x3f );
        v >>= 6;
    }
    return s;
}

/**
 * @param {string} str
 * @param {number} idx0
 * @param {number} idx1
 * @param {number} idx2
 * @return {string}
 */
function to64_triplet(str, idx0, idx1, idx2) {
    var v = (str.charCodeAt(idx0) << 16) |
        (str.charCodeAt(idx1) <<  8) |
        (str.charCodeAt(idx2));
    return to64(v, 4);
}

/**
 * @param {string} str
 * @param {number} idx0
 * @return {string}
 */
function to64_single(str, idx0) {
    var v = str.charCodeAt(idx0);
    return to64(v, 2);
}



/**
 * descrypt() adapted from FreeSec libcrypt
 * Taken from $OpenBSD: crypt.c,v 1.18 2003/08/12 01:22:17 deraadt Exp $
 *
 * Original license:
 * Copyright (c) 1994 David Burren
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 4. Neither the name of the author nor the names of other contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 */
/**
 * @param {number} ch
 * @return {number}
 */
function ascii_to_bin(ch) {
    var lz = "z".charCodeAt(0),
        la = "a".charCodeAt(0),
        uz = "Z".charCodeAt(0),
        ua = "A".charCodeAt(0),
        ni = "9".charCodeAt(0),
        dt = ".".charCodeAt(0);

    if (ch >  lz) return 0;
    if (ch >= la) return (ch - la + 38);
    if (ch >  uz) return 0;
    if (ch >= ua) return (ch - ua + 12);
    if (ch >  ni) return 0;
    if (ch >= dt) return (ch - dt);
    return 0;
}

const des_IP = [
    58, 50, 42, 34, 26, 18, 10,  2, 60, 52, 44, 36, 28, 20, 12,  4,
    62, 54, 46, 38, 30, 22, 14,  6, 64, 56, 48, 40, 32, 24, 16,  8,
    57, 49, 41, 33, 25, 17,  9,  1, 59, 51, 43, 35, 27, 19, 11,  3,
    61, 53, 45, 37, 29, 21, 13,  5, 63, 55, 47, 39, 31, 23, 15,  7
];

const des_key_perm = [
    57, 49, 41, 33, 25, 17,  9,  1, 58, 50, 42, 34, 26, 18,
    10,  2, 59, 51, 43, 35, 27, 19, 11,  3, 60, 52, 44, 36,
    63, 55, 47, 39, 31, 23, 15,  7, 62, 54, 46, 38, 30, 22,
    14,  6, 61, 53, 45, 37, 29, 21, 13,  5, 28, 20, 12,  4
];

const /** !Array<number> */ des_key_shifts = [
    1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1 ];

const des_comp_perm = [
    14, 17, 11, 24,  1,  5,  3, 28, 15,  6, 21, 10,
    23, 19, 12,  4, 26,  8, 16,  7, 27, 20, 13,  2,
    41, 52, 31, 37, 47, 55, 30, 40, 51, 45, 33, 48,
    44, 49, 39, 56, 34, 53, 46, 42, 50, 36, 29, 32
];

const des_sbox = [
    [
        14,  4, 13,  1,  2, 15, 11,  8,  3, 10,  6, 12,  5,  9,  0,  7,
        0, 15,  7,  4, 14,  2, 13,  1, 10,  6, 12, 11,  9,  5,  3,  8,
        4,  1, 14,  8, 13,  6,  2, 11, 15, 12,  9,  7,  3, 10,  5,  0,
        15, 12,  8,  2,  4,  9,  1,  7,  5, 11,  3, 14, 10,  0,  6, 13
    ], [
        15,  1,  8, 14,  6, 11,  3,  4,  9,  7,  2, 13, 12,  0,  5, 10,
        3, 13,  4,  7, 15,  2,  8, 14, 12,  0,  1, 10,  6,  9, 11,  5,
        0, 14,  7, 11, 10,  4, 13,  1,  5,  8, 12,  6,  9,  3,  2, 15,
        13,  8, 10,  1,  3, 15,  4,  2, 11,  6,  7, 12,  0,  5, 14,  9
    ], [
        10,  0,  9, 14,  6,  3, 15,  5,  1, 13, 12,  7, 11,  4,  2,  8,
        13,  7,  0,  9,  3,  4,  6, 10,  2,  8,  5, 14, 12, 11, 15,  1,
        13,  6,  4,  9,  8, 15,  3,  0, 11,  1,  2, 12,  5, 10, 14,  7,
        1, 10, 13,  0,  6,  9,  8,  7,  4, 15, 14,  3, 11,  5,  2, 12
    ], [
        7, 13, 14,  3,  0,  6,  9, 10,  1,  2,  8,  5, 11, 12,  4, 15,
        13,  8, 11,  5,  6, 15,  0,  3,  4,  7,  2, 12,  1, 10, 14,  9,
        10,  6,  9,  0, 12, 11,  7, 13, 15,  1,  3, 14,  5,  2,  8,  4,
        3, 15,  0,  6, 10,  1, 13,  8,  9,  4,  5, 11, 12,  7,  2, 14
    ], [
        2, 12,  4,  1,  7, 10, 11,  6,  8,  5,  3, 15, 13,  0, 14,  9,
        14, 11,  2, 12,  4,  7, 13,  1,  5,  0, 15, 10,  3,  9,  8,  6,
        4,  2,  1, 11, 10, 13,  7,  8, 15,  9, 12,  5,  6,  3,  0, 14,
        11,  8, 12,  7,  1, 14,  2, 13,  6, 15,  0,  9, 10,  4,  5,  3
    ], [
        12,  1, 10, 15,  9,  2,  6,  8,  0, 13,  3,  4, 14,  7,  5, 11,
        10, 15,  4,  2,  7, 12,  9,  5,  6,  1, 13, 14,  0, 11,  3,  8,
        9, 14, 15,  5,  2,  8, 12,  3,  7,  0,  4, 10,  1, 13, 11,  6,
        4,  3,  2, 12,  9,  5, 15, 10, 11, 14,  1,  7,  6,  0,  8, 13
    ], [
        4, 11,  2, 14, 15,  0,  8, 13,  3, 12,  9,  7,  5, 10,  6,  1,
        13,  0, 11,  7,  4,  9,  1, 10, 14,  3,  5, 12,  2, 15,  8,  6,
        1,  4, 11, 13, 12,  3,  7, 14, 10, 15,  6,  8,  0,  5,  9,  2,
        6, 11, 13,  8,  1,  4, 10,  7,  9,  5,  0, 15, 14,  2,  3, 12
    ], [
        13,  2,  8,  4,  6, 15, 11,  1, 10,  9,  3, 14,  5,  0, 12,  7,
        1, 15, 13,  8, 10,  3,  7,  4, 12,  5,  6, 11,  0, 14,  9,  2,
        7, 11,  4,  1,  9, 12, 14,  2,  0,  6, 10, 13, 15,  3,  5,  8,
        2,  1, 14,  7,  4, 10,  8, 13, 15, 12,  9,  0,  3,  5,  6, 11
    ]];

const des_pbox = [
    16,  7, 20, 21, 29, 12, 28, 17,  1, 15, 23, 26,  5, 18, 31, 10,
    2,  8, 24, 14, 32, 27,  3,  9, 19, 13, 30,  6, 22, 11,  4, 25
];

const des_bits32 = [
    0x80000000, 0x40000000, 0x20000000, 0x10000000,
    0x08000000, 0x04000000, 0x02000000, 0x01000000,
    0x00800000, 0x00400000, 0x00200000, 0x00100000,
    0x00080000, 0x00040000, 0x00020000, 0x00010000,
    0x00008000, 0x00004000, 0x00002000, 0x00001000,
    0x00000800, 0x00000400, 0x00000200, 0x00000100,
    0x00000080, 0x00000040, 0x00000020, 0x00000010,
    0x00000008, 0x00000004, 0x00000002, 0x00000001
];

const bits28 = [
    0x08000000, 0x04000000, 0x02000000, 0x01000000,
    0x00800000, 0x00400000, 0x00200000, 0x00100000,
    0x00080000, 0x00040000, 0x00020000, 0x00010000,
    0x00008000, 0x00004000, 0x00002000, 0x00001000,
    0x00000800, 0x00000400, 0x00000200, 0x00000100,
    0x00000080, 0x00000040, 0x00000020, 0x00000010,
    0x00000008, 0x00000004, 0x00000002, 0x00000001
];

const bits24 = [
    0x00800000, 0x00400000, 0x00200000, 0x00100000,
    0x00080000, 0x00040000, 0x00020000, 0x00010000,
    0x00008000, 0x00004000, 0x00002000, 0x00001000,
    0x00000800, 0x00000400, 0x00000200, 0x00000100,
    0x00000080, 0x00000040, 0x00000020, 0x00000010,
    0x00000008, 0x00000004, 0x00000002, 0x00000001
];

const des_bits8 = [ 0x80, 0x40, 0x20, 0x10, 0x08, 0x04, 0x02, 0x01 ];

var /** !Array<!Array<number>> */ u_sbox = new Array(8);
var /** !Array<!Array<number>> */ m_sbox = new Array(4);
var /** !Array<number> */ init_perm = new Array(64);
var /** !Array<number> */ final_perm = new Array(64);
var /** !Array<number> */ inv_key_perm = new Array(64);
var /** !Array<number> */ u_key_perm = new Array(56);
var /** !Array<number> */ inv_comp_perm = new Array(56);
var /** !Array<!Array<number>> */ ip_maskl = new Array(8);
var /** !Array<!Array<number>> */ ip_maskr = new Array(8);
var /** !Array<!Array<number>> */ fp_maskl = new Array(8);
var /** !Array<!Array<number>> */ fp_maskr = new Array(8);
var /** !Array<number> */ un_pbox = new Array(32);
var /** !Array<!Array<number>> */ psbox = new Array(4);
var /** !Array<!Array<number>> */ key_perm_maskl = new Array(8);
var /** !Array<!Array<number>> */ key_perm_maskr = new Array(8);
var /** !Array<!Array<number>> */ comp_maskl = new Array(8);
var /** !Array<!Array<number>> */ comp_maskr = new Array(8);

/** - */
function des_init() {
    /*
     * Invert the S-boxes, reordering the input bits.
     */
    for (var i = 0; i < 8; i++) {
        u_sbox[i] = new Array(64);
        for (var j = 0; j < 64; j++) {
            b = (j & 0x20) | ((j & 1) << 4) | ((j >> 1) & 0xf);
            u_sbox[i][j] = des_sbox[i][b];
        }
    }

    /*
     * Convert the inverted S-boxes into 4 arrays of 8 bits.
     * Each will handle 12 bits of the S-box input.
     */
    for (var b = 0; b < 4; b++) {
        m_sbox[b] = new Array(4096);
        for (var i = 0; i < 64; i++)
            for (var j = 0; j < 64; j++)
                m_sbox[b][(i << 6) | j] =
                    (u_sbox[(b << 1)][i] << 4) |
                    u_sbox[(b << 1) + 1][j];
    }

    /*
     * Set up the initial & final permutations into a useful form, and
     * initialise the inverted key permutation.
     */
    for (var i = 0; i < 64; i++) {
        init_perm[final_perm[i] = des_IP[i] - 1] = i;
        inv_key_perm[i] = 255;
    }

    /*
     * Invert the key permutation and initialise the inverted key
     * compression permutation.
     */
    for (var i = 0; i < 56; i++) {
        u_key_perm[i] = des_key_perm[i] - 1;
        inv_key_perm[des_key_perm[i] - 1] = i;
        inv_comp_perm[i] = 255;
    }

    /*
     * Invert the key compression permutation.
     */
    for (i = 0; i < 48; i++) {
        inv_comp_perm[des_comp_perm[i] - 1] = i;
    }

    /*
     * Set up the OR-mask arrays for the initial and final permutations,
     * and for the key initial and compression permutations.
     */
    for (var k = 0; k < 8; k++) {
        ip_maskl[k] = new Array(256);
        ip_maskr[k] = new Array(256);
        fp_maskl[k] = new Array(256);
        fp_maskr[k] = new Array(256);
        key_perm_maskl[k] = new Array(128);
        key_perm_maskr[k] = new Array(128);
        comp_maskl[k] = new Array(128);
        comp_maskr[k] = new Array(128);

        for (var i = 0; i < 256; i++) {
            ip_maskl[k][i] = 0;
            ip_maskr[k][i] = 0;
            fp_maskl[k][i] = 0;
            fp_maskr[k][i] = 0;
            for (var j = 0; j < 8; j++) {
                var inbit = 8 * k + j;
                if (i & des_bits8[j]) {
                    var obit = init_perm[inbit];
                    if (obit < 32)
                        ip_maskl[k][i] |=
                            des_bits32[obit];
                    else
                        ip_maskr[k][i] |=
                            des_bits32[obit-32];

                    if ((obit = final_perm[inbit]) < 32)
                        fp_maskl[k][i] |=
                            des_bits32[obit];
                    else
                        fp_maskr[k][i] |=
                            des_bits32[obit - 32];
                }
            }
        }
        for (var i = 0; i < 128; i++) {
            key_perm_maskl[k][i] = 0;
            key_perm_maskr[k][i] = 0;
            for (var j = 0; j < 7; j++) {
                inbit = 8 * k + j;
                if (i & des_bits8[j + 1]) {
                    if ((obit = inv_key_perm[inbit]) == 255)
                        continue;
                    if (obit < 28)
                        key_perm_maskl[k][i] |=
                            bits28[obit];
                    else
                        key_perm_maskr[k][i] |=
                            bits28[obit - 28];
                }
            }
            comp_maskl[k][i] = 0;
            comp_maskr[k][i] = 0;
            for (var j = 0; j < 7; j++) {
                inbit = 7 * k + j;
                if (i & des_bits8[j + 1]) {
                    if ((obit=inv_comp_perm[inbit]) == 255)
                        continue;
                    if (obit < 24)
                        comp_maskl[k][i] |=
                            bits24[obit];
                    else
                        comp_maskr[k][i] |=
                            bits24[obit - 24];
                }
            }
        }
    }

    /*
     * Invert the P-box permutation, and convert into OR-masks for
     * handling the output of the S-box arrays setup above.
     */
    for (var i = 0; i < 32; i++)
        un_pbox[des_pbox[i] - 1] = i;

    for (var b = 0; b < 4; b++) {
        psbox[b] = new Array(256);
        for (var i = 0; i < 256; i++) {
            psbox[b][i] = 0;
            for (var j = 0; j < 8; j++) {
                if (i & des_bits8[j])
                    psbox[b][i] |=
                        des_bits32[un_pbox[8 * b + j]];
            }
        }
    }
}

var en_keysl = new Array(16),
    en_keysr = new Array(16);

/**
 * @param {!Array<number>} key
 */
function des_setkey(key) {
    var rawkey0, rawkey1, k0, k1;

    rawkey0 = (key[0] << 24) |
        (key[1] << 16) |
        (key[2] <<  8) |
        (key[3] <<  0);

    rawkey1 = (key[4] << 24) |
        (key[5] << 16) |
        (key[6] <<  8) |
        (key[7] <<  0);

    /* Do key permutation and split into two 28-bit subkeys. */
    k0 = key_perm_maskl[0][rawkey0 >>> 25]
        | key_perm_maskl[1][(rawkey0 >>> 17) & 0x7f]
        | key_perm_maskl[2][(rawkey0 >>> 9) & 0x7f]
        | key_perm_maskl[3][(rawkey0 >>> 1) & 0x7f]
        | key_perm_maskl[4][rawkey1 >>> 25]
        | key_perm_maskl[5][(rawkey1 >>> 17) & 0x7f]
        | key_perm_maskl[6][(rawkey1 >>> 9) & 0x7f]
        | key_perm_maskl[7][(rawkey1 >>> 1) & 0x7f];
    k1 = key_perm_maskr[0][rawkey0 >>> 25]
        | key_perm_maskr[1][(rawkey0 >>> 17) & 0x7f]
        | key_perm_maskr[2][(rawkey0 >>> 9) & 0x7f]
        | key_perm_maskr[3][(rawkey0 >>> 1) & 0x7f]
        | key_perm_maskr[4][rawkey1 >>> 25]
        | key_perm_maskr[5][(rawkey1 >>> 17) & 0x7f]
        | key_perm_maskr[6][(rawkey1 >>> 9) & 0x7f]
        | key_perm_maskr[7][(rawkey1 >>> 1) & 0x7f];

    /* Rotate subkeys and do compression permutation. */
    var shifts = 0;
    for (var round = 0; round < 16; round++) {
        var t0, t1;

        shifts += des_key_shifts[round];

        t0 = (k0 << shifts) | (k0 >>> (28 - shifts));
        t1 = (k1 << shifts) | (k1 >>> (28 - shifts));

        en_keysl[round] = comp_maskl[0][(t0 >>> 21) & 0x7f]
            | comp_maskl[1][(t0 >>> 14) & 0x7f]
            | comp_maskl[2][(t0 >>> 7) & 0x7f]
            | comp_maskl[3][t0 & 0x7f]
            | comp_maskl[4][(t1 >>> 21) & 0x7f]
            | comp_maskl[5][(t1 >>> 14) & 0x7f]
            | comp_maskl[6][(t1 >>> 7) & 0x7f]
            | comp_maskl[7][t1 & 0x7f];

        en_keysr[round] = comp_maskr[0][(t0 >>> 21) & 0x7f]
            | comp_maskr[1][(t0 >>> 14) & 0x7f]
            | comp_maskr[2][(t0 >>> 7) & 0x7f]
            | comp_maskr[3][t0 & 0x7f]
            | comp_maskr[4][(t1 >>> 21) & 0x7f]
            | comp_maskr[5][(t1 >>> 14) & 0x7f]
            | comp_maskr[6][(t1 >>> 7) & 0x7f]
            | comp_maskr[7][t1 & 0x7f];
    }
}

var saltbits;

/**
 * @param {number} salt
 */
function des_setup_salt(salt) {
    saltbits = 0;
    var saltbit = 1;
    var obit = 0x800000;
    for (var i = 0; i < 24; i++) {
        if (salt & saltbit)
            saltbits |= obit;
        saltbit <<= 1;
        obit >>= 1;
    }
}

var des_r0, des_r1;

/** - */
function des_do_des() {
    var l, r, f, r48l, r48r;
    var count = 25;

    /* Don't bother with initial permutation. */
    l = r = 0;

    while (count--) {
        /* Do each round. */
        var kl = 0;
        var kr = 0;
        var round = 16;
        while (round--) {
            /* Expand R to 48 bits (simulate the E-box). */
            r48l    = ((r & 0x00000001) << 23)
                | ((r & 0xf8000000) >>> 9)
                | ((r & 0x1f800000) >>> 11)
                | ((r & 0x01f80000) >>> 13)
                | ((r & 0x001f8000) >>> 15);

            r48r    = ((r & 0x0001f800) << 7)
                | ((r & 0x00001f80) << 5)
                | ((r & 0x000001f8) << 3)
                | ((r & 0x0000001f) << 1)
                | ((r & 0x80000000) >>> 31);
            /*
             * Do salting for crypt() and friends, and
             * XOR with the permuted key.
             */
            f = (r48l ^ r48r) & saltbits;
            r48l ^= f ^ en_keysl[ kl++ ];
            r48r ^= f ^ en_keysr[ kr++ ];
            /*
             * Do sbox lookups (which shrink it back to 32 bits)
             * and do the pbox permutation at the same time.
             */
            f = psbox[0][m_sbox[0][r48l >> 12]]
                | psbox[1][m_sbox[1][r48l & 0xfff]]
                | psbox[2][m_sbox[2][r48r >> 12]]
                | psbox[3][m_sbox[3][r48r & 0xfff]];
            /*
             * Now that we've permuted things, complete f().
             */
            f ^= l;
            l = r;
            r = f;
        }
        r = l;
        l = f;
    }

    /* Final permutation (inverse of IP). */
    des_r0 = fp_maskl[0][l >>> 24]
        | fp_maskl[1][(l >>> 16) & 0xff]
        | fp_maskl[2][(l >>> 8) & 0xff]
        | fp_maskl[3][l & 0xff]
        | fp_maskl[4][r >>> 24]
        | fp_maskl[5][(r >>> 16) & 0xff]
        | fp_maskl[6][(r >>> 8) & 0xff]
        | fp_maskl[7][r & 0xff];
    des_r1 = fp_maskr[0][l >>> 24]
        | fp_maskr[1][(l >>> 16) & 0xff]
        | fp_maskr[2][(l >>> 8) & 0xff]
        | fp_maskr[3][l & 0xff]
        | fp_maskr[4][r >>> 24]
        | fp_maskr[5][(r >>> 16) & 0xff]
        | fp_maskr[6][(r >>> 8) & 0xff]
        | fp_maskr[7][r & 0xff];
}

/**
 * @param {string} key
 * @param {string} salt_str
 * @return {string}
 */
function descrypt(key, salt_str) {
    var keybuf = new Array(8);
    var output = salt_str.slice(0,2);

    var q = 0;
    var keypos = 0;
    while (q < 8) {
        keybuf[q] = key.charCodeAt(keypos) << 1;
        q++;
        if (keypos < key.length) keypos++;
    }

    des_setkey(keybuf);

    /* This is the "old style" DES crypt. */
    var salt = (ascii_to_bin(salt_str.charCodeAt(1)) << 6) |
        ascii_to_bin(salt_str.charCodeAt(0));
    des_setup_salt(salt);
    des_do_des();

    var l = (des_r0 >>> 8);
    output += ascii64.charAt( (l >>> 18) & 0x3f );
    output += ascii64.charAt( (l >>> 12) & 0x3f );
    output += ascii64.charAt( (l >>>  6) & 0x3f );
    output += ascii64.charAt( (l >>>  0) & 0x3f );

    l = (des_r0 << 16) | ((des_r1 >>> 16) & 0xffff);
    output += ascii64.charAt( (l >>> 18) & 0x3f );
    output += ascii64.charAt( (l >>> 12) & 0x3f );
    output += ascii64.charAt( (l >>>  6) & 0x3f );
    output += ascii64.charAt( (l >>>  0) & 0x3f );

    l = (des_r1 << 2);
    output += ascii64.charAt( (l >>> 12) & 0x3f );
    output += ascii64.charAt( (l >>>  6) & 0x3f );
    output += ascii64.charAt( (l >>>  0) & 0x3f );

    return output;
}



/* (the following code was stripped down from its original form)
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.1 Copyright (C) Paul Johnston 1999 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */

/*
 * Configurable variables. You may need to tweak these to be compatible with
 * the server-side, but the defaults work in most cases.
 */
const hexcase = 0;  /* hex output format. 0 - lowercase; 1 - uppercase        */
const b64pad  = ''; /* base-64 pad character. "=" for strict RFC compliance   */
const chrsz   = 8;  /* bits per input character. 8 - ASCII; 16 - Unicode      */

/**
 * @param {string} s
 * @return {string}
 */
function str_md5(s) {
    return binl2str(core_md5(str2binl(s), s.length * chrsz));
}

/**
 * Calculate the MD5 of an array of little-endian words, and a bit length
 * @param {!Array<number>} x
 * @param {number} len
 * @return {!Array<number>}
 */
function core_md5(x, len) {
    /* append padding */
    x[len >> 5] |= 0x80 << ((len) % 32);
    x[(((len + 64) >>> 9) << 4) + 14] = len;

    var a =  1732584193;
    var b = -271733879;
    var c = -1732584194;
    var d =  271733878;

    for(var i = 0; i < x.length; i += 16) {
        var olda = a;
        var oldb = b;
        var oldc = c;
        var oldd = d;

        a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
        d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
        c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
        b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
        a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
        d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
        c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
        b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
        a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
        d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
        c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
        b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
        a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
        d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
        c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
        b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

        a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
        d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
        c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
        b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
        a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
        d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
        c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
        b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
        a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
        d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
        c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
        b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
        a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
        d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
        c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
        b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

        a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
        d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
        c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
        b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
        a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
        d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
        c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
        b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
        a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
        d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
        c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
        b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
        a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
        d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
        c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
        b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

        a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
        d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
        c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
        b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
        a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
        d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
        c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
        b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
        a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
        d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
        c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
        b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
        a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
        d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
        c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
        b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

        a = safe_add(a, olda);
        b = safe_add(b, oldb);
        c = safe_add(c, oldc);
        d = safe_add(d, oldd);
    }
    return Array(a, b, c, d);
}

/**
 * These functions implement the four basic operations the algorithm uses.
 * @param {number} q
 * @param {number} a
 * @param {number} b
 * @param {number} x
 * @param {number} s
 * @param {number} t
 * @return {number}
 */
function md5_cmn(q, a, b, x, s, t) {
    return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
}

/**
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {number} d
 * @param {number} x
 * @param {number} s
 * @param {number} t
 * @return {number}
 */
function md5_ff(a, b, c, d, x, s, t) {
    return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
}
/**
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {number} d
 * @param {number} x
 * @param {number} s
 * @param {number} t
 * @return {number}
 */
function md5_gg(a, b, c, d, x, s, t) {
    return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
}
/**
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {number} d
 * @param {number} x
 * @param {number} s
 * @param {number} t
 * @return {number}
 */
function md5_hh(a, b, c, d, x, s, t) {
    return md5_cmn(b ^ c ^ d, a, b, x, s, t);
}
/**
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {number} d
 * @param {number} x
 * @param {number} s
 * @param {number} t
 * @return {number}
 */
function md5_ii(a, b, c, d, x, s, t) {
    return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
}

/**
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 *
 * @param {number} x
 * @param {number} y
 * @return {number}
 */
function safe_add(x, y) {
    var lsw = (x & 0xFFFF) + (y & 0xFFFF);
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
}

/**
 * Bitwise rotate a 32-bit number to the left.
 * @param {number} num
 * @param {number} cnt
 * @return {number}
 */
function bit_rol(num, cnt) {
    return (num << cnt) | (num >>> (32 - cnt));
}

/**
 * Convert a string to an array of little-endian words
 * If chrsz is ASCII, characters >255 have their hi-byte silently ignored.
 *
 * @param {string} str
 * @return {!Array<number>}
 */
function str2binl(str)
{
    var bin = Array();
    var mask = (1 << chrsz) - 1;
    for(var i = 0; i < str.length * chrsz; i += chrsz) {
        bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (i%32);
    }
    return bin;
}

/**
 * Convert an array of little-endian words to a string
 * @param {!Array<number>} bin
 * @return {string}
 */
function binl2str(bin) {
    var str = '';
    var mask = (1 << chrsz) - 1;
    for(var i = 0; i < bin.length * 32; i += chrsz)
        str += String.fromCharCode((bin[i>>5] >>> (i % 32)) & mask);
    return str;
}

const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

function encrypt(text) {
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

function decrypt(text) {
    const iv = Buffer.from(text.iv, 'hex');
    const encryptedText = Buffer.from(text.encryptedData, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

module.exports = {
    md5crypt,
    encrypt,
    decrypt
};