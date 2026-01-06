import React, { useState, useEffect, useRef } from 'react';

const OTPInput = ({ length = 6, value = '', onChange, disabled = false }) => {
    const [otp, setOtp] = useState(new Array(length).fill(""));
    const inputRefs = useRef([]);

    useEffect(() => {
        if (value) {
            const valArr = value.split('').slice(0, length);
            const newOtp = [...valArr, ...new Array(length - valArr.length).fill("")];
            setOtp(newOtp);
        }
    }, [value, length]);

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return false;

        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);
        onChange(newOtp.join(""));

        // Focus next input
        if (element.value && index < length - 1) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace") {
            if (!otp[index] && index > 0) {
                inputRefs.current[index - 1].focus();
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text/plain").slice(0, length);
        if (/^\d+$/.test(pastedData)) {
            const newOtp = pastedData.split("");
            while (newOtp.length < length) {
                newOtp.push("");
            }
            setOtp(newOtp);
            onChange(newOtp.join(""));
            inputRefs.current[Math.min(pastedData.length, length - 1)].focus();
        }
    };

    return (
        <div className="flex gap-2 justify-center">
            {otp.map((data, index) => (
                <input
                    key={index}
                    type="text"
                    maxLength="1"
                    ref={(input) => (inputRefs.current[index] = input)}
                    value={data}
                    onChange={(e) => handleChange(e.target, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-12 h-12 text-center text-xl font-bold border rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                    disabled={disabled}
                />
            ))}
        </div>
    );
};

export default OTPInput;
