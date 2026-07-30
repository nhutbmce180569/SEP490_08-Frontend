import React, { useState, useEffect, useRef } from "react";
import { Save, X, UploadCloud, Trash2, ChevronDown, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "../../contexts/LocaleContext";
import { ActionButton } from "./ActionButton";
import { MultiSelectDropdown } from "./MultiSelectDropdown";
import { SearchableSelect } from "./SearchableSelect";
import { ImageCropModal } from "../profile/ImageCropModal";
const DynamicFileInput: React.FC<{
  field: FormField;
  value: any;
  error?: string;
  onChange: (val: any) => void;
  onError: (err: string) => void;
}> = ({ field, value, error, onChange, onError }) => {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (value instanceof File) {
      const objectUrl = URL.createObjectURL(value);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (typeof value === "string" && value) {
      setPreview(value);
    } else {
      setPreview(null);
    }
  }, [value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        onError(t("content.onlyImageFilesAllowed"));
        e.target.value = "";
        return;
      }
      if (field.crop) {
        setTempImageSrc(URL.createObjectURL(file));
        setIsCropModalOpen(true);
      } else {
        onChange(file);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith("image/")) {
        onError(t("content.onlyImageFilesAllowed"));
        return;
      }
      if (field.crop) {
        setTempImageSrc(URL.createObjectURL(file));
        setIsCropModalOpen(true);
      } else {
        onChange(file);
      }
    }
  };

  const handleCropComplete = (croppedFile: File, croppedUrl: string) => {
    onChange(croppedFile);
    setIsCropModalOpen(false);
    setTempImageSrc(null);
  };

  const handleRemoveImage = () => {
    onChange(null);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <div
        className={`relative flex w-full flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all ${
          error
            ? "border-rose-400 bg-rose-50/50"
            : "border-slate-200 bg-slate-50 hover:border-brand hover:bg-brand/5"
        } ${!preview ? "cursor-pointer py-10" : "py-8"}`}
        onClick={!preview ? triggerFileSelect : undefined}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
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
                {t("common.changeImage")}
              </ActionButton>
              <ActionButton
                type="button"
                variant="warning"
                onClick={(e) => {
                  e.preventDefault();
                  handleRemoveImage();
                }}
                className="gap-2 px-4 py-2 text-sm"
              >
                <Trash2 className="h-4 w-4" />
                {t("common.removeImage")}
              </ActionButton>
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-brand">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="text-sm font-semibold text-slate-700">{t("common.clickToUpload")}</div>
              <div className="text-xs text-slate-500">{t("common.uploadFormatHint")}</div>
            </div>
            <ActionButton
              type="button"
              variant="secondary"
              className="pointer-events-none mt-2 gap-2 px-4 py-2 text-sm"
            >
              <UploadCloud className="h-4 w-4" />
              {t("common.browseFiles")}
            </ActionButton>
          </div>
        )}
      </div>
      {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
      {tempImageSrc && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          imageSrc={tempImageSrc}
          onClose={() => setIsCropModalOpen(false)}
          onCropComplete={handleCropComplete}
          aspect={field.cropAspect}
          cropShape={field.cropShape}
        />
      )}
    </div>
  );
};


export interface FormField {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "searchable-select" | "textarea" | "custom" | "file" | "date" | "datetime-local" | "time" | "multiselect" | "password" | "row";
  placeholder?: string;
  icon?: React.ReactNode;
  options?: { label: string; value: string | number }[];
  searchable?: boolean;
  subFields?: FormField[]; // Để gom nhóm nhiều field trên cùng 1 hàng
  colSpan?: 1 | 2; // Hỗ trợ trải rộng 2 cột (ví dụ như mô tả hoặc hình ảnh)
  required?: boolean; // Tự động check field không được bỏ trống
  maxLength?: number; // Giới hạn số lượng ký tự tối đa
  readOnly?: boolean; // Thêm cờ không cho phép nhập tay
  visible?: (formData: Record<string, any>) => boolean; // Ẩn/hiện field động theo dữ liệu form hiện tại
  validate?: (value: any, formData: Record<string, any>) => string | undefined; // Hàm validate custom
  onChangeCustom?: (value: any, setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>) => void; // Side effect khi field thay đổi
  render?: (value: any, onChange: (val: any) => void, error?: string, setFormData?: React.Dispatch<React.SetStateAction<Record<string, any>>>, formData?: Record<string, any>) => React.ReactNode; // Dùng cho các field đặc biệt
  crop?: boolean;
  cropShape?: 'round' | 'rect';
  cropAspect?: number;
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
  submitText,
  cancelText,
  initialValues,
  serverErrors
}) => {
  const { t } = useTranslation();
  const resolvedSubmit = submitText ?? t("common.save");
  const resolvedCancel = cancelText ?? t("common.cancel");
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
        newErrors[field.name] = t("common.fieldRequired", { label: field.label });
        isValid = false;
      }
      // Kiểm tra file type trong lúc submit nếu có file
      else if (field.type === "file" && value instanceof File && !value.type.startsWith("image/")) {
        newErrors[field.name] = t("content.onlyImageFilesAllowed");
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
      return (
        <div className="flex flex-col gap-1.5">
          {field.render(value, (val) => handleChange(field.name, val), error, setFormData, formData)}
          {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
        </div>
      );
    }

    if (field.type === "file") {
      return (
        <DynamicFileInput
          key={field.name}
          field={field}
          value={value}
          error={error}
          onChange={(val) => handleChange(field.name, val)}
          onError={(err) => setErrors((prev) => ({ ...prev, [field.name]: err }))}
        />
      );
    }

    const baseInputClass = `input-field py-2.5 pr-4 text-sm ${field.icon ? "pl-10" : ""
      } ${error
        ? "!border-rose-500 focus:!border-rose-500 !bg-rose-50/30 focus:!shadow-[0_0_0_3px_rgba(244,63,94,0.12)]"
        : ""
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
              maxLength={field.maxLength}
              onChange={(e) => handleChange(field.name, e.target.value)}
            />
          ) : field.type === "searchable-select" || (field.type === "select" && field.searchable) ? (
            <SearchableSelect
              options={field.options || []}
              value={value}
              onChange={(val) => {
                handleChange(field.name, val);
                if (field.onChangeCustom) field.onChangeCustom(val, setFormData);
              }}
              placeholder={field.placeholder || t("common.select")}
              error={!!error}
              disabled={field.readOnly}
              icon={field.icon}
            />
          ) : field.type === "select" ? (
            <>
              <select
                className={`${baseInputClass} appearance-none !pr-10 ${field.readOnly ? "cursor-not-allowed bg-slate-100 opacity-80" : ""}`}
                value={value}
                disabled={field.readOnly}
                onChange={(e) => {
                  handleChange(field.name, e.target.value);
                  if (field.onChangeCustom) field.onChangeCustom(e.target.value, setFormData);
                }}
              >
                <option value="">{field.placeholder || t("common.select", { defaultValue: "Select..." })}</option>
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
              placeholder={field.placeholder || t("common.selectOptions")}
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
              maxLength={field.maxLength}
              className={`${baseInputClass} ${field.readOnly ? "cursor-not-allowed bg-slate-100 opacity-80" : ""}`}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => {
                const val = e.target.value;
                if (field.type === "number" && val !== "") {
                  handleChange(field.name, Number(val));
                  if (field.onChangeCustom) field.onChangeCustom(Number(val), setFormData);
                } else {
                  handleChange(field.name, val);
                  if (field.onChangeCustom) field.onChangeCustom(val, setFormData);
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
          <ActionButton 
            type="button" 
            variant="secondary" 
            onClick={(e) => {
              e.preventDefault();
              onCancel();
            }} 
            className="shrink-0 whitespace-nowrap gap-2 px-4 py-2 text-sm"
          >
            <X className="h-4 w-4" />
            {resolvedCancel}
          </ActionButton>
          <ActionButton 
            type="button" 
            variant="primary" 
            onClick={(e) => {
              e.preventDefault();
              handleSubmit();
            }} 
            className="shrink-0 whitespace-nowrap gap-2 px-4 py-2 text-sm"
          >
            <Save className="h-4 w-4" />
            {resolvedSubmit}
          </ActionButton>
        </div>
      </div>

      {/* Form Container */}
      <div className="glass-card p-6 md:p-8">
        {errors.general && (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600">
            {errors.general}
          </div>
        )}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {fields
            .filter((field) => (field.visible ? field.visible(formData) : true))
            .map((field) => {
              if (field.type === "row" && field.subFields) {
                const visibleSubFields = field.subFields.filter((sf) => (sf.visible ? sf.visible(formData) : true));
                const cols = visibleSubFields.length;
                const gridClass = cols === 3 ? "md:grid-cols-3" : cols === 4 ? "md:grid-cols-4" : cols === 1 ? "md:grid-cols-1" : "md:grid-cols-2";
                return (
                  <div key={field.name || "row"} className={field.colSpan === 2 ? "md:col-span-2" : ""}>
                    <div className={`grid grid-cols-1 gap-6 ${gridClass}`}>
                      {visibleSubFields.map((subField) => (
                        <div key={subField.name}>
                          <label className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                            <span>
                              {subField.label}
                              {subField.required && <span className="ml-1 text-rose-500">*</span>}
                            </span>
                            {subField.maxLength && (
                              <span className="text-xs font-normal text-slate-400">
                                {String(formData[subField.name] ?? "").length}/{subField.maxLength}
                              </span>
                            )}
                          </label>
                          {renderInput(subField)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={field.name}
                  className={field.colSpan === 2 ? "md:col-span-2" : ""}
                >
                  <label className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                    <span>
                      {field.label}
                      {field.required && (
                        <span className="ml-1 text-rose-500">*</span>
                      )}
                    </span>
                    {field.maxLength && (
                      <span className="text-xs font-normal text-slate-400">
                        {String(formData[field.name] ?? "").length}/{field.maxLength}
                      </span>
                    )}
                  </label>
                  {renderInput(field)}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};