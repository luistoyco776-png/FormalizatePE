const DATA = {
  statusLabels: {
    "no-iniciado": "No iniciado",
    pendiente: "Pendiente",
    "en-proceso": "En proceso",
    completado: "Completado"
  },
  statusStyles: {
    "no-iniciado": ["status-no-iniciado", "circle-dashed"],
    pendiente: ["status-pendiente", "circle"],
    "en-proceso": ["status-en-proceso", "loader-circle"],
    completado: ["status-completado", "circle-check"]
  },
  legalFigures: {
    sac: {
      title: "Persona jurídica · SAC",
      short: "SAC",
      summary: "Una Sociedad Anónima Cerrada puede ser una alternativa cuando el emprendimiento tiene de 2 a 20 accionistas. Su conveniencia depende de las necesidades y obligaciones del negocio.",
      highlights: ["Permite organizar la participación de accionistas", "La responsabilidad se limita, en general, al aporte realizado", "Requiere un proceso formal de constitución e inscripción"]
    },
    ruc10: {
      title: "Persona natural con negocio",
      short: "Persona natural",
      summary: "La persona desarrolla la actividad económica a su propio nombre y se registra ante SUNAT. La responsabilidad por las obligaciones del negocio recae, en general, sobre su patrimonio personal.",
      highlights: ["No requiere constituir una persona jurídica", "Puede ser una vía más sencilla para iniciar por cuenta propia", "La elección del régimen tributario depende de las condiciones del negocio"]
    }
  },
  questions: [
    { id: "socios", question: "¿Vas a emprender con otras personas?", help: "Piensa si habrá otras personas como socias o accionistas.", yes: "Sí, con socios", no: "No, por mi cuenta" },
    { id: "patrimonio", question: "¿Consideras importante separar el patrimonio personal del negocio?", help: "Una persona jurídica puede separar patrimonios, según el tipo societario y la ley.", yes: "Sí, es importante", no: "No es mi prioridad" },
    { id: "capital", question: "¿El negocio tendrá aportes de capital de varias personas o una estructura más formal?", help: "Considera dinero, bienes, equipos y la forma en que se organizará el negocio.", yes: "Sí", no: "No / aún no lo defino" }
  ],
  stages: [
    {
      id: "reserva-nombre", step: 1, title: "Reserva de nombre", entity: "SUNARP",
      description: "La reserva de nombre permite solicitar que se reserve una denominación para una futura persona jurídica. No suele corresponder a una persona natural con negocio.",
      cost: "Referencial", duration: "Depende del trámite",
      initialStatus: "pendiente", uploadHint: "Adjunta la constancia de reserva de nombre",
      requirements: ["DNI de la persona solicitante o representante, según corresponda", "Opciones de denominación o razón social", "Tipo de persona jurídica definido", "Verificar la tasa y las condiciones vigentes en SUNARP"],
      links: [
        { label: "Constituir una empresa", href: "https://www.gob.pe/10580", entity: "Gob.pe / SUNARP" },
        { label: "Portal institucional", href: "https://www.sunarp.gob.pe/", entity: "SUNARP" }
      ],
      appliesToRuc10: false
    },
    {
      id: "acto-constitutivo", step: 2, title: "Acto constitutivo", entity: "PRODUCE / Notaría",
      description: "Para constituir una persona jurídica, se prepara el acto constitutivo con los acuerdos y reglas de organización. El procedimiento y la documentación dependen del tipo de empresa y la modalidad elegida.",
      cost: "Variable", duration: "Depende de la modalidad",
      initialStatus: "no-iniciado", uploadHint: "Adjunta el documento constitutivo o la evidencia disponible",
      requirements: ["Datos de identificación de quienes participan", "Denominación y actividad económica definidas", "Reglas de organización y representación acordadas", "Detalle de aportes, cuando corresponda", "Consultar si puede utilizarse una vía de constitución asistida"],
      links: [
        { label: "Abrir o hacer negocio", href: "https://www.gob.pe/263-abrir-o-hacer-negocio", entity: "PRODUCE / Gob.pe" },
        { label: "Orientación de PRODUCE", href: "https://www.gob.pe/produce", entity: "PRODUCE" }
      ],
      appliesToRuc10: false
    },
    {
      id: "inscripcion-rrpp", step: 3, title: "Inscripción registral", entity: "Notaría / SUNARP",
      description: "La constitución de una persona jurídica requiere su inscripción en el registro correspondiente. Los documentos, costos y plazos dependen de la modalidad y de la evaluación registral.",
      cost: "Variable", duration: "Depende del trámite",
      initialStatus: "no-iniciado", uploadHint: "Adjunta la constancia o documento registral",
      requirements: ["Documentación de constitución preparada", "Intervención notarial, cuando corresponda", "Pago de los derechos aplicables", "Verificar el estado y las observaciones del trámite"],
      links: [
        { label: "Constitución de empresa", href: "https://www.gob.pe/10580", entity: "Gob.pe / SUNARP" },
        { label: "Portal institucional", href: "https://www.sunarp.gob.pe/", entity: "SUNARP" }
      ],
      appliesToRuc10: false
    },
    {
      id: "ruc-clave-sol", step: 4, title: "RUC y acceso a SUNAT", entity: "SUNAT",
      description: "La inscripción o actualización del RUC permite identificar al contribuyente. Las condiciones para persona natural con negocio y persona jurídica no son idénticas; verifica la guía aplicable a tu caso.",
      cost: "Consulta fuente vigente", duration: "Depende del canal y caso",
      initialStatus: "no-iniciado", uploadHint: "Adjunta tu ficha RUC u otra constancia pertinente",
      requirements: ["Documento de identidad de la persona titular o representante", "Datos del domicilio fiscal", "Información de la actividad económica", "Revisar los regímenes tributarios y sus condiciones", "Solicitar o activar el acceso correspondiente a SUNAT"],
      links: [
        { label: "Regímenes tributarios", href: "https://emprender.sunat.gob.pe/ruc/regimenes-tributarios-mype/regimenes-tributarios", entity: "SUNAT" },
        { label: "Portal SUNAT", href: "https://www.sunat.gob.pe/", entity: "SUNAT" }
      ],
      appliesToRuc10: true
    },
    {
      id: "licencia-municipal", step: 5, title: "Licencia de funcionamiento", entity: "Municipalidad",
      description: "Si el negocio opera en un establecimiento, revisa las condiciones de licencia municipal y seguridad aplicables en el distrito y según el nivel de riesgo. No todos los modelos de negocio siguen exactamente la misma ruta.",
      cost: "Según municipalidad", duration: "Según evaluación",
      initialStatus: "no-iniciado", uploadHint: "Adjunta la licencia o constancia relacionada",
      requirements: ["Definir la dirección y actividad del establecimiento", "Consultar zonificación y compatibilidad de uso, según corresponda", "Revisar los requisitos de licencia del distrito", "Verificar las condiciones de seguridad e ITSE aplicables", "Confirmar la tasa y el procedimiento municipal vigente"],
      links: [
        { label: "Licencia de funcionamiento", href: "https://www.gob.pe/busquedas?term=licencia%20de%20funcionamiento", entity: "Gob.pe" },
        { label: "Información sobre ITSE", href: "https://www.gob.pe/busquedas?term=ITSE", entity: "Gob.pe" }
      ],
      appliesToRuc10: true
    }
  ],
  initialDocuments: [
    { id: "doc-1", name: "ejemplo_dni_titular.pdf", sizeKb: 842, stageId: "ruc-clave-sol", uploadedAt: "Demo" },
    { id: "doc-2", name: "constancia_ejemplo.pdf", sizeKb: 316, stageId: "ruc-clave-sol", uploadedAt: "Demo" },
    { id: "doc-3", name: "notas_constitucion.pdf", sizeKb: 204, stageId: "acto-constitutivo", uploadedAt: "Demo" }
  ],
  officialGuides: [
    { label: "Abrir o hacer negocio en Perú", href: "https://www.gob.pe/263-abrir-o-hacer-negocio", entity: "Gob.pe / PRODUCE", description: "Punto de partida para revisar la orientación estatal para iniciar un negocio." },
    { label: "Constituir una empresa", href: "https://www.gob.pe/10580", entity: "Gob.pe / SUNARP", description: "Información sobre la constitución de una persona jurídica." },
    { label: "Regímenes tributarios", href: "https://emprender.sunat.gob.pe/ruc/regimenes-tributarios-mype/regimenes-tributarios", entity: "SUNAT", description: "Información para comparar los regímenes tributarios y sus condiciones." },
    { label: "Portal institucional", href: "https://www.sunarp.gob.pe/", entity: "SUNARP", description: "Portal oficial para consultar información registral." },
    { label: "Portal SUNAT", href: "https://www.sunat.gob.pe/", entity: "SUNAT", description: "Portal de la administración tributaria." }
  ],
  navItems: [
    { id: "progreso", label: "Mi Progreso", shortLabel: "Progreso", icon: "list-checks" },
    { id: "boveda", label: "Bóveda de Documentos", shortLabel: "Bóveda", icon: "folder-lock" },
    { id: "guias", label: "Guías Oficiales", shortLabel: "Guías", icon: "book-open" }
  ]
};
export { DATA };
