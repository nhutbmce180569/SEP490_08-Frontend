import React, { useState, useEffect, useRef } from "react";
import { Save, X, UploadCloud, Trash2, ChevronDown, Eye, EyeOff } from "lucide-react";
import { ActionButton } from "./ActionButton";
import { MultiSelectDropdown } from "./MultiSelectDropdown";

export interface FormField {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "custom" | "file" | "date" | "datetime-local" | "time" | "multiselect" | "password";
  placeholder?: string;
  icon?: React.ReactNode;
  options?: { label: string; value: string | number }[];
  colSpan?: 1 | 2; // Hỗ trợ trải rộng 2 cột (ví dụ như mô tả hoặc hình ảnh)
  required?: boolean; // Tự động check field không được bỏ trống
  readOnly?: boolean; // Thêm cờ không cho phép nhập tay
  visible?: (formData: Record<string, any>) => boolean; // Ẩn/hiện field động theo dữ liệu form hiện tại
  validate?: (value: any, formData: Record<string, any>) => string | undefined; // Hàm validate custom
  render?: (value: any, onChange: (val: any) => void, error?: string, setFormData?: React.Dispatch<React.SetStateAction<Record<string, any>>>, formData?: Record<string, any>) => React.ReactNode; // Dùng cho các field đặc biệt
}

interface DynamicFormProps {
  title: string;
  description?: string;
  fields: FormField[];
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  onCancel: () => void;
  submitText?: string;
  cancelText?: string;
  initialValues?: Record<string, any>;
  serverErrors?: Record<string, any>;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  title,
  description,
  fields,
  initialData = {},
  onSubmit,
  onCancel,
  submitText = "Save",
  cancelText = "Cancel",
  initialValues,
  serverErrors
}) => {
  // Khởi tạo biến an toàn để tránh lỗi undefined
  const safeInitialData = initialData || {};
  const safeInitialValues = initialValues || {};

  // Khởi tạo state bằng cách gộp cả initialData và initialValues
  const [formData, setFormData] = useState<Record<string, any>>({ ...safeInitialData, ...safeInitialValues });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Ép kiểu sang chuỗi để so sánh sâu (Deep Compare), tránh re-render vô hạn do Object reference thay đổi
  const initDataStr = JSON.stringify(safeInitialData);
  const initValuesStr = JSON.stringify(safeInitialValues);

  // Đồng bộ lại state nếu parent component truyền initialValues vào sau khi đã render
  useEffect(() => {
    setFormData({ ...safeInitialData, ...safeInitialValues });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initDataStr, initValuesStr]);

  // Đồng bộ lỗi từ Server (nếu có) vào state lỗi của Form
  useEffect(() => {
    if (serverErrors && Object.keys(serverErrors).length > 0) {
      const normalizedErrors: Record<string, string> = {};
      Object.entries(serverErrors).forEach(([key, val]) => {
        // Chuyển key từ PascalCase (.NET) sang camelCase (React/TS) để match với field.name
        const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
        
        // .NET thường trả về mảng chuỗi (ví dụ: ["OperatorId must be greater than 0"])
        normalizedErrors[camelKey] = Array.isArray(val) ? val[0] : String(val);
      });
      setErrors((prev) => ({ ...prev, ...normalizedErrors }));
    }
  }, [serverErrors]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Xoá lỗi của field đó khi người dùng bắt đầu nhập lại
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPasswords((prev) => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    const visibleFields = fields.filter((field) => (field.visible ? field.visible(formData) : true));

    visibleFields.forEach((field) => {
      const value = formData[field.name];
      
      // Kiểm tra required
      if (field.required && (value === undefined || value === null || value === "")) {
        newErrors[field.name] = `${field.label} is required.`;
        isValid = false;
      } 
      // Kiểm tra hàm validate custom
      else if (field.validate) {
        const errorMsg = field.validate(value, formData);
        if (errorMsg) {
          newErrors[field.name] = errorMsg;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);

    if (isValid) {
      onSubmit(formData);
    }
  };

  const renderInput = (field: FormField) => {
    // Sử dụng ?? thay cho || để tránh lỗi các field số có giá trị = 0 bị biến thành chuỗi rỗng
    const value = formData[field.name] ?? "";
    const error = errors[field.name];

    // Nếu là trường custom, cho phép tự render giao diện dựa trên logic truyền vào
    if (field.type === "custom" && field.render) {
      return field.render(value, (val) => handleChange(field.name, val), error, setFormData, formData);
    }

    if (field.type === "file") {
      const [preview, setPreview] = useState<string | null>(null);
      const fileInputRef = useRef<HTMLInputElement>(null);

      useEffect(() => {
        if (value instanceof File) {
          const objectUrl = URL.createObjectURL(value);
          setPreview(objectUrl);
          // Dọn dẹp object URL khi component unmount hoặc value thay đổi
          return () => URL.revokeObjectURL(objectUrl);
        } else if (typeof value === 'string' && value) {
          // Dành cho form Update, sẽ hiển thị ảnh từ URL
          setPreview(value);
        } else {
          setPreview(null);
        }
      }, [value]);

      const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
          handleChange(field.name, e.target.files[0]);
        }
      };

      const handleRemoveImage = () => {
        handleChange(field.name, null);
      };

      const triggerFileSelect = () => {
        fileInputRef.current?.click();
      };

      return (
        <div className="flex w-full flex-col gap-2">
          <div 
            className={`relative flex w-full flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all ${
              error 
                ? 'border-rose-400 bg-rose-50/50' 
                : 'border-slate-200 bg-slate-50 hover:border-[#4880ff] hover:bg-[#4880ff]/5'
            } ${!preview ? 'cursor-pointer py-10' : 'py-8'}`}
            onClick={!preview ? triggerFileSelect : undefined}
          >
            <input
              ref={fileInputRef}
              type="file"
              id={field.name}
              accept="image/*"
              onChange={handleFileChange}
              onClick={(e) => e.stopPropagation()}
              className="hidden"
            />
            
            {preview ? (
              <div className="flex w-full flex-col items-center justify-center gap-4">
                <div className="relative h-40 w-full max-w-[280px] overflow-hidden rounded-lg border border-slate-200 shadow-sm">
                  <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                </div>
                <div className="flex items-center justify-center gap-3">
                  <ActionButton
                    type="button"
                    variant="secondary"
                    onClick={triggerFileSelect}
                    className="gap-2 px-4 py-2 text-sm"
                  >
                    <UploadCloud className="h-4 w-4" />
                    Change Image
                  </ActionButton>
                  <ActionButton
                    type="button"
                    variant="warning"
                    onClick={(e) => { e.preventDefault(); handleRemoveImage(); }}
                    className="gap-2 px-4 py-2 text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </ActionButton>
                </div>
              </div>
            ) : (
              <div className="flex w-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4880ff]/10 text-[#4880ff]">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="text-sm font-semibold text-slate-700">
                    Click to upload or drag and drop
                  </div>
                  <div className="text-xs text-slate-500">
                    SVG, PNG, JPG or GIF (max. 5MB)
                  </div>
                </div>
                <ActionButton
                  type="button"
                  variant="secondary"
                  className="pointer-events-none mt-2 gap-2 px-4 py-2 text-sm"
                >
                  <UploadCloud className="h-4 w-4" />
                  Browse Files
                </ActionButton>
              </div>
            )}
          </div>
          {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
        </div>
      );
    }

    const baseInputClass = `w-full rounded-xl border bg-slate-50 py-2.5 pr-4 text-sm text-slate-700 outline-none transition-colors focus:bg-white ${
      field.icon ? "pl-10" : "pl-4"
    } ${
      error
        ? "border-rose-500 focus:border-rose-500 bg-rose-50/30"
        : "border-slate-200 focus:border-[#4880ff]"
    }`;

    return (
      <div className="flex flex-col gap-1.5">
        <div className="relative">
          {field.icon && (
            <div className={`absolute left-3 ${error ? "text-rose-400" : "text-slate-400"} ${field.type === 'textarea' ? 'top-3' : 'top-1/2 -translate-y-1/2'}`}>
              {field.icon}
            </div>
          )}
          
          {field.type === "textarea" ? (
            <textarea
              rows={4}
              className={baseInputClass}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleChange(field.name, e.target.value)}
            />
          ) : field.type === "select" ? (
            <>
              <select
                className={`${baseInputClass} appearance-none !pr-10`}
                value={value}
                onChange={(e) => handleChange(field.name, e.target.value)}
              >
                <option value="">Select...</option>
                {field.options?.map((opt, i) => (
                  <option key={i} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </>
          ) : field.type === "multiselect" ? (
            <MultiSelectDropdown
              options={field.options || []}
              selectedValues={Array.isArray(value) ? value : (value ? [value] : [])}
              onChange={(vals) => handleChange(field.name, vals)}
              placeholder={field.placeholder || "Select options..."}
            />
          ) : field.type === "password" ? (
            <>
              <input
                type={showPasswords[field.name] ? "text" : "password"}
                className={`${baseInputClass} !pr-12`}
                placeholder={field.placeholder}
                value={value}
                onChange={(e) => handleChange(field.name, e.target.value)}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility(field.name)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 outline-none transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                {showPasswords[field.name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </>
          ) : (
            <input
              type={field.type}
              readOnly={field.readOnly}
              className={`${baseInputClass} ${field.readOnly ? "cursor-not-allowed bg-slate-100 opacity-80" : ""}`}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => {
                const val = e.target.value;
                if (field.type === "number" && val !== "") {
                  handleChange(field.name, Number(val));
                } else {
                  handleChange(field.name, val);
                }
              }}
            />
          )}
        </div>
        
        {/* Hiển thị Error Message */}
        {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="sm:w-6/12">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center justify-end gap-3 sm:w-4/12">
          <ActionButton variant="secondary" onClick={onCancel} className="shrink-0 whitespace-nowrap gap-2 px-4 py-2 text-sm">
            <X className="h-4 w-4" />
            {cancelText}
          </ActionButton>
          <ActionButton variant="primary" onClick={handleSubmit} className="shrink-0 whitespace-nowrap gap-2 px-4 py-2 text-sm">
            <Save className="h-4 w-4" />
            {submitText}
          </ActionButton>
        </div>
      </div>

      {/* Form Container */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {fields
            .filter((field) => (field.visible ? field.visible(formData) : true))
            .map((field) => (
            <div
              key={field.name}
              className={field.colSpan === 2 ? "md:col-span-2" : ""}
            >
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                {field.label}
                {field.required && (
                  <span className="ml-1 text-rose-500">*</span>
                )}
              </label>
              {renderInput(field)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};