import React, { useState, useEffect } from "react";
import { useTranslation } from "../../../contexts/LocaleContext";
import { useToast } from "../../../contexts/ToastContext";
import { useSystemSettings } from "../hooks/useSystemSettings";
import { systemService } from "../services/system.service";
import ReactQuill from "react-quill-new";
import { Save, Image as ImageIcon, Briefcase, FileText } from "lucide-react";
import { LoadingOverlay } from "../../../components/dashboard/LoadingOverlay";
import { getImg } from "../../../config/api/api";
import { LogoCropModal } from "../../../components/profile/LogoCropModal";
import { StayHubLogo } from "../../../components/brand/StayHubLogo";

export const SystemSettings: React.FC = () => {
  const { t } = useTranslation();
  const { success, error: showError } = useToast();
  const { settings, isLoading, refetch } = useSystemSettings();

  const [activeTab, setActiveTab] = useState("branding");
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [webLogoFile, setWebLogoFile] = useState<File | null>(null);
  const [webVideoLogoFile, setWebVideoLogoFile] = useState<File | null>(null);
  const [webLogoPreview, setWebLogoPreview] = useState<string>("");
  const [webVideoLogoPreview, setWebVideoLogoPreview] = useState<string>("");

  // Crop states
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (settings.length > 0) {
      const initialData: Record<string, string> = {};
      settings.forEach((s) => {
        initialData[s.settingKey] = s.settingValue;
      });
      
      // Merge with default keys in case they are missing in DB
      const defaultKeys = [
        "CompanyName", "CompanyPhone", "CompanyEmail", "CompanyAddress", "MapIframeUrl", "CompanyDescription",
        "AboutUs", "ContactUs", "PrivacyPolicy", "TermsAndConditions", "BookingRegulations", 
        "RefundRegulations", "DataPolicy", "CookiePolicy"
      ];
      
      defaultKeys.forEach(key => {
        if (initialData[key] === undefined) {
          initialData[key] = "";
        }
        if (initialData[`${key}_en`] === undefined) {
          initialData[`${key}_en`] = "";
        }
      });
      
      setFormData(initialData);

      if (initialData["WebLogo"]) {
        setWebLogoPreview(getImg(initialData["WebLogo"]));
      }
      if (initialData["WebVideoLogo"]) {
        setWebVideoLogoPreview(getImg(initialData["WebVideoLogo"]));
      }
    }
  }, [settings]);

  const handleTextChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "web" | "webVideo") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "web" && !file.type.startsWith("image/")) {
      showError(t("content.onlyImageFilesAllowed"));
      return;
    }
    if (type === "webVideo" && !file.type.startsWith("video/")) {
      showError("Chỉ chấp nhận file video"); // Keep simple, or use translation
      return;
    }

    if (type === "web") {
      const url = URL.createObjectURL(file);
      setCropImageSrc(url);
      setCropModalOpen(true);
    } else if (type === "webVideo") {
      const videoElement = document.createElement("video");
      videoElement.preload = "metadata";
      videoElement.onloadedmetadata = () => {
        URL.revokeObjectURL(videoElement.src);
        if (videoElement.duration > 10) {
          showError("Video giới hạn tối đa 10 giây");
          return;
        }
        setWebVideoLogoFile(file);
        setWebVideoLogoPreview(URL.createObjectURL(file));
      };
      videoElement.src = URL.createObjectURL(file);
    }
  };

  const handleCropComplete = (croppedFile: File, croppedUrl: string) => {
    setWebLogoFile(croppedFile);
    setWebLogoPreview(croppedUrl);
    setCropModalOpen(false);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const updateItems = Object.keys(formData).map((key) => ({
        settingKey: key,
        settingValue: formData[key],
      }));

      await systemService.updateSettings({
        settings: updateItems,
        webLogoFile: webLogoFile || undefined,
        webVideoLogoFile: webVideoLogoFile || undefined,
      });

      success(t("admin.settingsSavedSuccess"));
      refetch();
    } catch (err: any) {
      showError(err.response?.data?.message || t("admin.settingsSaveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && settings.length === 0) {
    return <div className="flex justify-center p-10">{t("common.loading")}</div>;
  }

  const tabs = [
    { id: "branding", label: t("admin.branding"), icon: <ImageIcon className="h-4 w-4" /> },
    { id: "general", label: t("admin.generalInfo"), icon: <Briefcase className="h-4 w-4" /> },
    { id: "policies", label: t("admin.policies"), icon: <FileText className="h-4 w-4" /> },
  ];

  const htmlFields = [
    { key: "AboutUs", label: t("admin.aboutUs") },
    { key: "PrivacyPolicy", label: t("admin.privacyPolicy") },
    { key: "TermsAndConditions", label: t("admin.terms") },
    { key: "BookingRegulations", label: t("admin.bookingRegulations") },
    { key: "RefundRegulations", label: t("admin.refundRegulations") },
    { key: "DataPolicy", label: t("admin.dataPolicy") },
    { key: "CookiePolicy", label: t("admin.cookiePolicy") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">{t("admin.systemSettings")}</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-dark disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {t("common.save")}
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-brand text-brand"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {activeTab === "branding" && (
          <div className="space-y-8">
            <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">{t("admin.logoSidebarPreview")}</h3>
                <p className="text-sm text-slate-500">{t("admin.logoSidebarPreviewDesc")}</p>
              </div>
              <div className="h-16 flex items-center border border-slate-200 bg-white px-6 rounded-xl shadow-sm">
                <img
                  src={webLogoPreview || (settings.find(s => s.settingKey === "WebLogo")?.settingValue ? getImg(settings.find(s => s.settingKey === "WebLogo")!.settingValue) : "")}
                  alt="StayHub"
                  aria-hidden
                  className="h-10 w-auto shrink-0 object-contain md:h-11"
                  style={{
                    width: formData["WebLogoWidth"] ? `${formData["WebLogoWidth"]}px` : undefined,
                    height: formData["WebLogoHeight"] ? `${formData["WebLogoHeight"]}px` : undefined,
                  }}
                  draggable={false}
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.webLogo")}</label>
                <div className="mb-4 flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
                  {webLogoPreview ? (
                    <img src={webLogoPreview} alt={t("admin.webLogo")} className="max-h-full object-contain" />
                  ) : (
                    <span className="text-sm text-slate-400">{t("admin.noWebLogo")}</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand-100">
                    {t("common.chooseFile")}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, "web")}
                      className="hidden"
                    />
                  </label>
                  <span className="text-sm text-slate-500 max-w-[200px] truncate">
                    {webLogoFile ? webLogoFile.name : t("common.noFileChosen")}
                  </span>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-500">{t("admin.widthPx")}</label>
                    <input
                      type="number"
                      value={formData["WebLogoWidth"] || ""}
                      onChange={(e) => handleTextChange("WebLogoWidth", e.target.value)}
                      placeholder={t("admin.widthPlaceholder")}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none transition-colors focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-500">{t("admin.heightPx")}</label>
                    <input
                      type="number"
                      value={formData["WebLogoHeight"] || ""}
                      onChange={(e) => handleTextChange("WebLogoHeight", e.target.value)}
                      placeholder={t("admin.heightPlaceholder")}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none transition-colors focus:border-brand"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{t("admin.videoLogoHeader")}</label>
                <div className="mb-4 flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
                  {webVideoLogoPreview ? (
                    <video src={webVideoLogoPreview} autoPlay loop muted className="max-h-full object-contain" />
                  ) : (
                    <span className="text-sm text-slate-400">{t("admin.noVideoLogo")}</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand-100">
                    {t("common.chooseFile")}
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileChange(e, "webVideo")}
                      className="hidden"
                    />
                  </label>
                  <span className="text-sm text-slate-500 max-w-[200px] truncate">
                    {webVideoLogoFile ? webVideoLogoFile.name : t("common.noFileChosen")}
                  </span>
                  {(webVideoLogoPreview || webVideoLogoFile) && (
                    <button
                      type="button"
                      onClick={() => {
                        setWebVideoLogoFile(null);
                        setWebVideoLogoPreview("");
                        setFormData((prev) => ({ ...prev, WebVideoLogo: "" }));
                      }}
                      className="ml-auto text-sm font-semibold text-red-500 hover:underline"
                    >
                      {t("common.delete")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "general" && (
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { key: "CompanyName", label: t("admin.companyName") },
              { key: "CompanyPhone", label: t("admin.companyPhone") },
              { key: "CompanyEmail", label: t("admin.companyEmail") },
              { key: "CompanyAddress", label: t("admin.companyAddress") },
              { key: "ApkDownloadLink", label: t("admin.apkDownloadLink") },
            ].map((field) => (
              <div key={field.key}>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">{field.label}</label>
                <input
                  type="text"
                  value={formData[field.key] || ""}
                  onChange={(e) => handleTextChange(field.key, e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand"
                />
              </div>
            ))}
            <div className="col-span-full grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t("admin.companyDescriptionVi")}</label>
                <textarea
                  value={formData["CompanyDescription"] || ""}
                  onChange={(e) => handleTextChange("CompanyDescription", e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t("admin.companyDescriptionEn")}</label>
                <textarea
                  value={formData["CompanyDescription_en"] || ""}
                  onChange={(e) => handleTextChange("CompanyDescription_en", e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand"
                />
              </div>
            </div>
            <div className="col-span-full">
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">{t("admin.googleMapIframe")}</label>
              <textarea
                value={formData["MapIframeUrl"] || ""}
                onChange={(e) => handleTextChange("MapIframeUrl", e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-brand"
              />
            </div>
          </div>
        )}

        {activeTab === "policies" && (
          <div className="space-y-12">
            {htmlFields.map((field) => (
              <div key={field.key} className="space-y-4 border-b border-slate-100 pb-8 last:border-0 last:pb-0">
                <label className="block text-lg font-bold text-slate-800">{field.label}</label>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-600">{t("admin.vietnamese")}</label>
                    <ReactQuill
                      theme="snow"
                      value={formData[field.key] || ""}
                      onChange={(val) => handleTextChange(field.key, val)}
                      className="bg-white rounded-xl h-64 mb-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-600">{t("admin.english")}</label>
                    <ReactQuill
                      theme="snow"
                      value={formData[`${field.key}_en`] || ""}
                      onChange={(val) => handleTextChange(`${field.key}_en`, val)}
                      className="bg-white rounded-xl h-64 mb-12"
                    />
                  </div>
                </div>
                {/* Add spacing after quill to prevent overlap */}
                <div className="h-10"></div> 
              </div>
            ))}
          </div>
        )}
      </div>
      <LoadingOverlay isOpen={isSaving} message={t("common.saving")} />

      {cropModalOpen && cropImageSrc && (
        <LogoCropModal
          isOpen={cropModalOpen}
          imageSrc={cropImageSrc}
          onClose={() => setCropModalOpen(false)}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
};
