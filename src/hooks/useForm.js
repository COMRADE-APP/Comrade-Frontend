import { useState, useCallback } from 'react';

export const useForm = (initialValues = {}, validate = null) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        setValues((prev) => ({ ...prev, [name]: newValue }));
        if (errors[name]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    }, [errors]);

    const setFieldValue = useCallback((name, value) => {
        setValues((prev) => ({ ...prev, [name]: value }));
    }, []);

    const handleBlur = useCallback((e) => {
        const { name } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        if (validate) {
            const fieldErrors = validate({ ...values, [name]: e.target.value });
            if (fieldErrors && fieldErrors[name]) {
                setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
            }
        }
    }, [values, validate]);

    const reset = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    }, [initialValues]);

    const handleSubmit = useCallback(async (onSubmit) => {
        if (validate) {
            const validationErrors = validate(values);
            if (validationErrors && Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors);
                setTouched(Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
                return;
            }
        }
        setIsSubmitting(true);
        try {
            await onSubmit(values);
        } catch (err) {
            if (err.response?.data) {
                const serverErrors = {};
                const errorData = err.response.data;
                if (typeof errorData === 'object') {
                    Object.entries(errorData).forEach(([key, msgs]) => {
                        serverErrors[key] = Array.isArray(msgs) ? msgs[0] : String(msgs);
                    });
                }
                setErrors(serverErrors);
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [values, validate]);

    return {
        values, errors, touched, isSubmitting,
        handleChange, setFieldValue, handleBlur,
        handleSubmit, reset, setErrors, setValues,
    };
};
