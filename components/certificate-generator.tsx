"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { FileUpload } from "@/components/file-upload"
import { CertificatePreview } from "@/components/certificate-preview"
import { useToast } from "@/hooks/use-toast"
import { Download, FileText, Settings, Upload, FileArchive, Plus, X, Users } from "lucide-react"
import * as XLSX from "xlsx"
import { PDFDocument } from 'pdf-lib' // <--- Nueva importación
import JSZip from 'jszip' // <--- Nueva importación

interface StudentData {
  Nombre: string
  Cedula: string
}

interface CertificateData {
  courseType: "pasantia" | "corto" | "nuevo"
  course: string
  customCourse?: string
  duration?: number
  instructor?: string
  hasInstructor: boolean
  excelFile?: File
  exportType: "zip" | "pdf"
  manualStudents: StudentData[]
}

const PREDEFINED_COURSES = {
  pasantia: [
    { value: "1", label: "Auxiliar de Farmacia", duration: 280, name: "Farmacia" },
    { value: "2", label: "Auxiliar de Enfermería", duration: 280, name: "Enfermeria" },
    { value: "3", label: "Asistente de Laboratorio Clínico", duration: 280, name: "Bionalisis" },
    { value: "4", label: "Asistente Administrativo Contable", duration: 280, name: "Administracion" },
  ],
  corto: [
    { value: "5", label: "Computacion", duration: 36, name: "Computacion" },
    { value: "6", label: "Office", duration: 36, name: "Office" },
    { value: "7", label: "Electronica", duration: 36, name: "Electronica" },
    { value: "8", label: "Barbería", duration: 36, name: "Barberia" },
    { value: "9", label: "Sistema de Uñas", duration: 36, name: "Sistema de Uñas" },
    { value: "10", label: "Depilación Facial", duration: 36, name: "Depilacion" },
  ],
}

export function CertificateGenerator() {
  const [data, setData] = useState<CertificateData>({
    courseType: "pasantia",
    course: "",
    hasInstructor: true,
    exportType: "zip",
    manualStudents: [],
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [newStudent, setNewStudent] = useState({ Nombre: "", Cedula: "" })
  const { toast } = useToast()

  const handleFileUpload = (file: File) => {
    setData((prev) => ({ ...prev, excelFile: file }))
    toast({
      title: "Archivo cargado",
      description: `${file.name} se ha cargado correctamente.`,
    })
  }

  const addManualStudent = () => {
    if (!newStudent.Nombre.trim() || !newStudent.Cedula.trim()) {
      toast({
        title: "Error",
        description: "Por favor, completa el nombre y la cédula del estudiante.",
        variant: "destructive",
      })
      return
    }

    if (data.manualStudents.some((student) => student.Cedula === newStudent.Cedula)) {
      toast({
        title: "Error",
        description: "Ya existe un estudiante con esta cédula.",
        variant: "destructive",
      })
      return
    }

    setData((prev) => ({
      ...prev,
      manualStudents: [...prev.manualStudents, { ...newStudent }],
    }))
    setNewStudent({ Nombre: "", Cedula: "" })
    toast({
      title: "Estudiante agregado",
      description: `${newStudent.Nombre} ha sido agregado a la lista.`,
    })
  }

  const removeManualStudent = (index: number) => {
    setData((prev) => ({
      ...prev,
      manualStudents: prev.manualStudents.filter((_, i) => i !== index),
    }))
  }

  const handleGenerate = async () => {
    // ... (Validaciones existentes)
    if (!data.excelFile && data.manualStudents.length === 0) {
      toast({
        title: "Error",
        description: "Por favor, sube un archivo Excel o agrega estudiantes manualmente.",
        variant: "destructive",
      });
      return;
    }
    if (!data.course && data.courseType !== "nuevo") {
      toast({
        title: "Error",
        description: "Por favor, selecciona un curso.",
        variant: "destructive",
      });
      return;
    }
    if (data.courseType === "nuevo" && (!data.customCourse || !data.duration)) {
      toast({
        title: "Error",
        description: "Por favor, completa el nombre y duración del curso personalizado.",
        variant: "destructive",
      });
      return;
    }
    if (data.hasInstructor && !data.instructor && data.courseType !== 'pasantia') {
      toast({
        title: "Error",
        description: "Por favor, ingresa el nombre del instructor.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true)

    try {
      let excelStudents: StudentData[] = []
      if (data.excelFile) {
        const arrayBuffer = await data.excelFile.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: "array" })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json<StudentData>(firstSheet)
        excelStudents = jsonData
      }

      const allStudents = [...excelStudents, ...data.manualStudents]

      if (allStudents.length === 0) {
        toast({
          title: "Error",
          description: "No se encontraron estudiantes para generar certificados.",
          variant: "destructive",
        })
        setIsGenerating(false)
        return
      }
      
      // --- INICIO DE CAMBIOS ---

      let requestBody: any = {
        // Siempre solicitamos un PDF unificado a la API
        unir_pdfs: true,
        eliminar_individuales: true, 
        estudiantes: allStudents.map((student) => ({
          nombre: student.Nombre,
          cedula: student.Cedula,
        })),
      };

      if (data.courseType === "nuevo") {
        requestBody.tipo_curso_id = 0;
        requestBody.curso_nombre = data.customCourse;
        requestBody.duracion_horas = data.duration;
      } else {
        requestBody.tipo_curso_id = data.courseType === "pasantia" ? 1 : 2;
        requestBody.curso_id = Number.parseInt(data.course);
      }
      
      if (data.courseType !== 'pasantia') {
          requestBody.incluir_instructor_seccion = data.hasInstructor;
          if (data.hasInstructor) {
              requestBody.nombre_instructor = data.instructor || "";
          }
      }

      // --- FIN DE CAMBIOS ---

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        let errorMessage = `Error del servidor: ${response.status}`;
        try {
          const errorJson = await response.json();
          errorMessage = errorJson.detail || errorJson.message || JSON.stringify(errorJson);
        } catch (e) {
            const errorText = await response.text();
            errorMessage = errorText.length < 500 ? errorText : `Error del servidor: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const combinedPdfBlob = await response.blob()

      if (combinedPdfBlob.size === 0) {
        throw new Error("El servidor devolvió un archivo vacío.")
      }
      
      const courseName =
      data.customCourse ||
      (data.courseType === "nuevo"
        ? "Curso_Personalizado"
        : PREDEFINED_COURSES[data.courseType as "pasantia" | "corto"]?.find((c) => c.value === data.course)?.name || "Curso")
      const year = new Date().getFullYear()

      // --- INICIO DE LÓGICA DE DESCARGA ---

      if (data.exportType === 'pdf') {
        // Descargar el PDF combinado directamente
        const url = window.URL.createObjectURL(combinedPdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Certificados_${courseName}_${year}.pdf`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 100);

      } else if (data.exportType === 'zip') {
        // Dividir el PDF y crear un ZIP
        const zip = new JSZip();
        const combinedPdfBytes = await combinedPdfBlob.arrayBuffer();
        const pdfDoc = await PDFDocument.load(combinedPdfBytes);
        const numberOfPages = pdfDoc.getPageCount();

        // Añadir el PDF combinado al ZIP
        zip.file(`Certificados_${courseName}_${year}_(completo).pdf`, combinedPdfBytes);

        for (let i = 0; i < numberOfPages; i++) {
          const student = allStudents[i];
          if (!student) continue;

          const newPdfDoc = await PDFDocument.create();
          const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
          newPdfDoc.addPage(copiedPage);

          const pdfBytes = await newPdfDoc.save();
          const studentNameSanitized = student.Nombre.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          zip.file(`Certificado_${studentNameSanitized}.pdf`, pdfBytes);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = window.URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Certificados_${courseName}_${year}.zip`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 100);
      }
      
      // --- FIN DE LÓGICA DE DESCARGA ---

      toast({
        title: "¡Certificados generados!",
        description: `Los certificados se han descargado como ${data.exportType.toUpperCase()}.`,
      })
    } catch (error) {
      toast({
        title: "Error al generar certificados",
        description: error instanceof Error ? error.message : "Hubo un problema. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const selectedCourse =
    data.courseType !== "nuevo" ? PREDEFINED_COURSES[data.courseType as "pasantia" | "corto"]?.find((c) => c.value === data.course) : null

  const totalStudents =
    (data.excelFile ? "Excel + " : "") + (data.manualStudents.length > 0 ? `${data.manualStudents.length} manual` : "")

  if (isGenerating) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <FileText className="absolute inset-0 m-auto h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-lg font-semibold">Creando los certificados</h3>
                <p className="text-sm text-muted-foreground">No tardo mucho...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Configuration Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración del Certificado
            </CardTitle>
            <CardDescription>Configura los parámetros para generar los certificados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Course Type */}
            <div className="space-y-2">
              <Label htmlFor="courseType">Tipo de Curso</Label>
              <Select
                value={data.courseType}
                onValueChange={(value: "pasantia" | "corto" | "nuevo") =>
                  setData((prev) => ({ ...prev, courseType: value, course: "" }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo de curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pasantia">Curso con Pasantía (280h)</SelectItem>
                  <SelectItem value="corto">Curso Corto (36h)</SelectItem>
                  <SelectItem value="nuevo">Curso Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Course Selection */}
            {data.courseType !== "nuevo" && (
              <div className="space-y-2">
                <Label htmlFor="course">Curso</Label>
                <Select value={data.course} onValueChange={(value) => setData((prev) => ({ ...prev, course: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_COURSES[data.courseType as "pasantia" | "corto"]?.map((course) => (
                      <SelectItem key={course.value} value={course.value}>
                        {course.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Custom Course */}
            {data.courseType === "nuevo" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customCourse">Nombre del Curso</Label>
                  <Input
                    id="customCourse"
                    placeholder="Ej: Diseño Gráfico Avanzado"
                    value={data.customCourse || ""}
                    onChange={(e) => setData((prev) => ({ ...prev, customCourse: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duración (horas)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="Ej: 120"
                    value={data.duration || ""}
                    onChange={(e) =>
                      setData((prev) => ({ ...prev, duration: Number.parseInt(e.target.value) || undefined }))
                    }
                  />
                </div>
              </div>
            )}

            {/* Instructor Toggle */}
            {data.courseType !== 'pasantia' && (
                <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <Label htmlFor="hasInstructor">¿Incluir Instructor?</Label>
                    <p className="text-sm text-muted-foreground">Los certificados mostrarán el nombre del instructor</p>
                </div>
                <Switch
                    id="hasInstructor"
                    checked={data.hasInstructor}
                    onCheckedChange={(checked) => setData((prev) => ({ ...prev, hasInstructor: checked }))}
                />
                </div>
            )}


            {/* Instructor Name */}
            {data.hasInstructor && data.courseType !== 'pasantia' && (
              <div className="space-y-2">
                <Label htmlFor="instructor">Nombre del Instructor</Label>
                <Input
                  id="instructor"
                  placeholder="Ej: Ing. María González"
                  value={data.instructor || ""}
                  onChange={(e) => setData((prev) => ({ ...prev, instructor: e.target.value }))}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="exportType">Tipo de Exportación</Label>
              <Select
                value={data.exportType}
                onValueChange={(value: "zip" | "pdf") => setData((prev) => ({ ...prev, exportType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo de exportación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zip">
                    <div className="flex items-center gap-2">
                      <FileArchive className="h-4 w-4" />
                      ZIP (Certificados individuales + PDF combinado)
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      PDF (Solo archivo combinado)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Datos de Estudiantes
            </CardTitle>
            <CardDescription>Sube un archivo Excel (.xlsx) o agrega estudiantes manualmente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload onFileUpload={handleFileUpload} />
            {data.excelFile && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{data.excelFile.name}</span>
                  <span className="text-xs text-muted-foreground">({(data.excelFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Student Entry Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Agregar Estudiantes Manualmente
            </CardTitle>
            <CardDescription>Agrega estudiantes uno por uno si no tienes archivo Excel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentName">Nombre Completo</Label>
                <Input
                  id="studentName"
                  placeholder="Ej: Juan Carlos Pérez"
                  value={newStudent.Nombre}
                  onChange={(e) => setNewStudent((prev) => ({ ...prev, Nombre: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentId">Cédula</Label>
                <Input
                  id="studentId"
                  placeholder="Ej: V-12.345.678"
                  value={newStudent.Cedula}
                  onChange={(e) => setNewStudent((prev) => ({ ...prev, Cedula: e.target.value }))}
                />
              </div>
            </div>
            <Button onClick={addManualStudent} className="w-full bg-transparent" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Estudiante
            </Button>

            {/* Manual Students List */}
            {data.manualStudents.length > 0 && (
              <div className="space-y-2">
                <Label>Estudiantes Agregados ({data.manualStudents.length})</Label>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {data.manualStudents.map((student, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{student.Nombre}</p>
                        <p className="text-xs text-muted-foreground">{student.Cedula}</p>
                      </div>
                      <Button
                        onClick={() => removeManualStudent(index)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total Students Summary */}
            {(data.excelFile || data.manualStudents.length > 0) && (
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium text-primary">Total de estudiantes: {totalStudents}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generate Button */}
        <Button onClick={handleGenerate} disabled={isGenerating} className="w-full" size="lg">
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Generando Certificados...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generar Certificados
            </>
          )}
        </Button>
      </div>

      {/* Preview Panel */}
      <div>
        <CertificatePreview
          courseTitle={selectedCourse?.label || data.customCourse || "Curso Seleccionado"}
          duration={selectedCourse?.duration || data.duration || 0}
          hasInstructor={data.hasInstructor}
          instructor={data.instructor}
        />
      </div>
    </div>
  )
}