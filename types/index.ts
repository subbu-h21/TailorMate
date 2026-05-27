export interface Customer {
  id: string
  name: string
  phone?: string
  measurements: Record<string, number>
  createdAt: string
  updatedAt: string
}

export interface PatternRecord {
  id: string
  customerId?: string
  customerName: string
  templateId: string
  templateName: string
  measurements: Record<string, number>
  createdAt: string
  svgSnapshot?: string
}

export interface TemplateMeta {
  id: string
  category: string
  variant: string
  description: string
  url: string
  measurements: string[]
}

export interface TemplatePoint {
  name: string
  x: string
  y: string
}

export interface TemplateLine {
  from: string
  to: string
}

export interface TemplateData {
  __patternCAD: boolean
  version: string
  projectName: string
  measurements: Record<string, number>
  points: TemplatePoint[]
  lines: TemplateLine[]
  constraints: unknown[]
  geoConstraints: unknown[]
}
