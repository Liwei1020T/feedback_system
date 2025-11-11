import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle, 
  SendHorizonal, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  FileText, 
  Upload,
  X,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCheck,
  Sparkles
} from "lucide-react";

import { listPlants, submitComplaint } from "../api";

const initialState = {
  emp_id: "",
  email: "",
  phone: "",
  complaint_text: "",
  plant: ""
};

const SubmitComplaintPage = () => {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<number | null>(null);
  const [plants, setPlants] = useState<string[]>([]);
  const [plantsLoading, setPlantsLoading] = useState(true);
  const [plantsError, setPlantsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchPlants = async () => {
      try {
        const data = await listPlants();
        if (isMounted) {
          setPlants(data);
          setPlantsError(null);
        }
      } catch (err) {
        if (isMounted) {
          setPlantsError(err instanceof Error ? err.message : "Failed to load plants.");
        }
      } finally {
        if (isMounted) {
          setPlantsLoading(false);
        }
      }
    };
    fetchPlants();
    return () => {
      isMounted = false;
    };
  }, []);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (file && !file.type.startsWith("image/")) {
      setFieldErrors((prev) => ({ ...prev, attachment: "Only image files are supported." }));
      event.target.value = "";
      setAttachment(null);
      setPreviewUrl(null);
      return;
    }
    setFieldErrors((prev) => {
      const updated = { ...prev };
      delete updated.attachment;
      return updated;
    });
    setAttachment(file);
    
    // Create preview
    if (file) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    
    // Validate all fields at once for single-page form
    if (!form.emp_id.trim()) errors.emp_id = "Employee ID is required";
    if (!form.phone.trim()) errors.phone = "Phone number is required";
    if (!form.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Please enter a valid email";
    }
    if (!form.plant.trim()) errors.plant = "Please select your plant";
    if (!form.complaint_text.trim()) errors.complaint_text = "Feedback is required";
    else if (form.complaint_text.trim().length < 10) {
      errors.complaint_text = "Please provide at least 10 characters";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    // Not used in single-page layout but keeping for compatibility
    if (validateStep(currentStep)) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    // Not used in single-page layout but keeping for compatibility
    setCurrentStep(1);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    
    if (!validateStep(1)) {
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const complaint = await submitComplaint(
        {
          emp_id: form.emp_id.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          complaint_text: form.complaint_text.trim(),
          plant: form.plant.trim()
        },
        attachment
      );
      setSuccessId(complaint.id);
      setForm(initialState);
      setAttachment(null);
      setPreviewUrl(null);
      setFieldErrors({});
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit complaint");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center px-4 py-4">
      <div className="w-full max-w-6xl animate-fade-in">
        
        {/* Header Section - Compact */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent">
              Employee Feedback Form
            </h1>
          </div>
          <p className="text-slate-600 text-sm">
            Your voice matters. Share your concerns with us.
          </p>
        </div>

        {/* Success Message */}
        {successId && (
          <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 text-emerald-700 shadow-lg animate-scale-in backdrop-blur-sm mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full p-2.5 shadow-md">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-900">
                    Success! Ticket #{successId}
                  </h3>
                  <p className="text-sm text-emerald-600">
                    We'll review and respond soon.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSuccessId(null);
                    setFieldErrors({});
                  }}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-bold text-white transition-all hover:shadow-md"
                >
                  Submit Another
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="rounded-lg border-2 border-emerald-600 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50 transition-all"
                >
                  Home
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form Card - Single Page Layout */}
        <div className="glass-card p-6 shadow-xl border-2 border-white/50">
          <form onSubmit={handleSubmit}>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column - Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b-2 border-slate-100">
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-2 rounded-lg">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
                </div>

                {/* Employee ID */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    Employee ID
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="emp_id"
                    value={form.emp_id}
                    onChange={handleChange}
                    placeholder="e.g., EMP12345"
                    className={`w-full rounded-lg border-2 ${
                      fieldErrors.emp_id ? 'border-red-300 bg-red-50' : 'border-slate-200'
                    } p-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400`}
                  />
                  {fieldErrors.emp_id && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.emp_id}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    Phone Number
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="e.g., +1 234 567 8900"
                    className={`w-full rounded-lg border-2 ${
                      fieldErrors.phone ? 'border-red-300 bg-red-50' : 'border-slate-200'
                    } p-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400`}
                  />
                  {fieldErrors.phone && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    Email Address
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="your.email@company.com"
                    className={`w-full rounded-lg border-2 ${
                      fieldErrors.email ? 'border-red-300 bg-red-50' : 'border-slate-200'
                    } p-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400`}
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Plant */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    Plant Location
                    <span className="text-red-500">*</span>
                  </label>
                  {plantsLoading ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500 p-2.5 bg-slate-50 rounded-lg">
                      <div className="animate-spin w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full" />
                      Loading...
                    </div>
                  ) : plants.length > 0 ? (
                    <select
                      name="plant"
                      value={form.plant}
                      onChange={handleChange}
                      className={`w-full rounded-lg border-2 ${
                        fieldErrors.plant ? 'border-red-300 bg-red-50' : 'border-slate-200'
                      } p-2.5 text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none text-slate-900`}
                    >
                      <option value="">Select your plant location</option>
                      {plants.map((plantOption) => (
                        <option key={plantOption} value={plantOption}>
                          {plantOption}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name="plant"
                      value={form.plant}
                      onChange={handleChange}
                      placeholder="Enter your plant code (e.g., P1)"
                      className={`w-full rounded-lg border-2 ${
                        fieldErrors.plant ? 'border-red-300 bg-red-50' : 'border-slate-200'
                      } p-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all outline-none text-slate-900 placeholder:text-slate-400`}
                    />
                  )}
                  {plantsError && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {plantsError}
                    </p>
                  )}
                  {fieldErrors.plant && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.plant}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column - Feedback Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b-2 border-slate-100">
                  <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 p-2 rounded-lg">
                    <FileText className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Your Feedback</h2>
                </div>

                {/* Complaint Text */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    Describe Your Concern
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="complaint_text"
                    value={form.complaint_text}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Please provide detailed information about your concern..."
                    className={`w-full rounded-lg border-2 ${
                      fieldErrors.complaint_text ? 'border-red-300 bg-red-50' : 'border-slate-200'
                    } p-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all outline-none resize-none text-slate-900 placeholder:text-slate-400 leading-relaxed`}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      {fieldErrors.complaint_text && (
                        <p className="text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {fieldErrors.complaint_text}
                        </p>
                      )}
                    </div>
                    <span className={`font-medium ${
                      form.complaint_text.length < 10 
                        ? 'text-slate-400' 
                        : form.complaint_text.length < 50 
                          ? 'text-amber-600' 
                          : 'text-emerald-600'
                    }`}>
                      {form.complaint_text.length} chars
                    </span>
                  </div>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    Attach Image
                    <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                  </label>
                  
                  {!attachment ? (
                    <label className="group relative flex flex-col items-center justify-center w-full h-24 rounded-lg border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 cursor-pointer transition-all">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition-colors mb-1" />
                      <p className="text-xs font-semibold text-slate-600 group-hover:text-emerald-600 transition-colors">
                        Click or drag to upload
                      </p>
                      <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
                    </label>
                  ) : (
                    <div className="relative rounded-lg border-2 border-emerald-200 bg-emerald-50/50 p-3 animate-scale-in">
                      <button
                        type="button"
                        onClick={removeAttachment}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-all hover:scale-110 shadow-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {previewUrl && (
                        <div className="mb-2">
                          <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="w-full h-32 object-cover rounded-md shadow-sm"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="bg-emerald-600 rounded-md p-1.5">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-emerald-900 truncate">
                            {attachment.name}
                          </p>
                          <p className="text-xs text-emerald-600">
                            {(attachment.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {fieldErrors.attachment && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.attachment}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 bg-red-50 border-2 border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={submitting}
                className="group w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 via-emerald-600 to-blue-600 hover:from-blue-700 hover:via-emerald-700 hover:to-blue-700 py-3 px-6 font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg shadow-md bg-size-200 bg-pos-0 hover:bg-pos-100"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    <span className="text-sm">Submitting...</span>
                  </>
                ) : (
                  <>
                    <SendHorizonal className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    <span className="text-sm">Submit Feedback</span>
                  </>
                )}
              </button>
              <p className="text-xs text-center text-slate-500 font-medium mt-2">
                🔒 Your information is confidential
              </p>
            </div>
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center mt-3">
          <button
            onClick={() => navigate("/")}
            className="text-xs text-slate-600 hover:text-blue-600 font-semibold transition-colors inline-flex items-center gap-1.5 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitComplaintPage;
