const DATA = {
  statusLabels: { 'no-iniciado':'No iniciado', pendiente:'Pendiente', 'en-proceso':'En proceso', completado:'Completado' },
  statusStyles: {
    'no-iniciado':'bg-slate-100 text-slate-600',
    pendiente:'bg-amber-50 text-amber-700',
    'en-proceso':'bg-brand-50 text-brand-700',
    completado:'bg-green-50 text-green-700'
  },
  legalFigures: {
    sac: { title:'Persona jurídica (SAC)', short:'SAC', summary:'Una Sociedad Anónima Cerrada puede ser adecuada para emprendimientos con socios. La conveniencia depende de las características del negocio y debe verificarse con orientación oficial.', highlights:['Puede separar el patrimonio de la empresa del patrimonio personal, dentro del marco legal aplicable.','Admite de 2 a 20 accionistas.','Su constitución implica pasos registrales y notariales.'] },
    ruc10: { title:'Persona natural con negocio', short:'Persona natural', summary:'La persona natural realiza la actividad comercial a título personal y responde por las obligaciones del negocio con su patrimonio, conforme a las reglas aplicables.', highlights:['No requiere constituir una persona jurídica.','La inscripción en el RUC se realiza ante SUNAT.','Debes verificar qué régimen tributario corresponde a tu actividad.'] }
  },
  questions: [
    { id:'socios', question:'¿Emprenderás con socios?', help:'La presencia de socios puede influir en la forma legal.', yes:'Sí, con socios', no:'No, por mi cuenta' },
    { id:'patrimonio', question:'¿Consideras importante separar el patrimonio personal del negocio?', help:'La responsabilidad depende de la forma legal elegida.', yes:'Sí, es importante', no:'No es mi prioridad' },
    { id:'local', question:'¿Tu emprendimiento tendrá un local físico abierto al público?', help:'Puede influir en los permisos municipales y condiciones de seguridad.', yes:'Sí, tendrá local', no:'No tendrá local abierto' }
  ],
  stages: [
    { id:'reserva-nombre', step:1, title:'Reserva de nombre', entity:'SUNARP', cost:'Tasa por verificar', duration:'Verificar plazo vigente', description:'La reserva de preferencia registral es parte del proceso de constitución de una persona jurídica. Confirma requisitos, disponibilidad y tasa en el canal oficial antes de iniciar.', initialStatus:'pendiente', appliesToRuc10:false, uploadHint:'Adjunta la constancia de reserva de nombre', requirements:['DNI de la persona solicitante o representante, según corresponda','Opciones de denominación o razón social','Forma societaria definida','Verificar tasa y vigencia en SUNARP'], links:[{label:'Orientación sobre reserva de nombre',href:'https://www.gob.pe/busquedas?term=reserva+de+nombre+empresa',entity:'Gob.pe'},{label:'SUNARP',href:'https://www.gob.pe/sunarp',entity:'SUNARP'}] },
    { id:'acto-constitutivo', step:2, title:'Acto constitutivo', entity:'PRODUCE / Notaría', cost:'Variable', duration:'Depende de la modalidad', description:'Se prepara el acto constitutivo y la información de socios, aportes y administración. Las alternativas y requisitos pueden variar; verifica el procedimiento aplicable con PRODUCE o el canal correspondiente.', initialStatus:'no-iniciado', appliesToRuc10:false, uploadHint:'Adjunta minuta o documento constitutivo', requirements:['Datos completos de socios o titulares','Acuerdo sobre aportes de capital o bienes','Información de administración y representación','Documento constitutivo preparado según la modalidad elegida'], links:[{label:'Orientación para constituir una empresa',href:'https://www.gob.pe/263-abrir-o-hacer-negocio',entity:'Gob.pe / PRODUCE'},{label:'PRODUCE',href:'https://www.gob.pe/produce',entity:'PRODUCE'}] },
    { id:'inscripcion-rrpp', step:3, title:'Inscripción registral', entity:'Notaría / SUNARP', cost:'Variable', duration:'Verificar plazo vigente', description:'Para constituir una persona jurídica, el documento correspondiente se presenta al registro por la vía que corresponda. Los costos notariales y registrales varían.', initialStatus:'no-iniciado', appliesToRuc10:false, uploadHint:'Adjunta constancia o documento registral', requirements:['Documento constitutivo y firmas según corresponda','Documentación solicitada por la notaría o canal de presentación','Pago de derechos aplicables, si corresponde','Verificar la inscripción y los datos registrados'], links:[{label:'SUNARP: servicios y orientación',href:'https://www.gob.pe/sunarp',entity:'SUNARP'},{label:'Consultar información registral',href:'https://www.sunarp.gob.pe/',entity:'SUNARP'}] },
    { id:'ruc-clave-sol', step:4, title:'RUC y Clave SOL', entity:'SUNAT', cost:'Inscripción: gratuita en los casos aplicables', duration:'Depende del canal y caso', description:'Gestiona el RUC, los datos del contribuyente y las credenciales correspondientes. La ruta concreta cambia según se trate de persona natural con negocio o persona jurídica.', initialStatus:'no-iniciado', appliesToRuc10:true, uploadHint:'Adjunta constancia o ficha RUC', requirements:['DNI y datos de identificación del contribuyente o representante','Domicilio fiscal y datos de contacto','Datos registrales si corresponde a persona jurídica','Revisar los regímenes tributarios y elegir el que corresponda'], links:[{label:'Obtener RUC',href:'https://www.gob.pe/busquedas?term=obtener+RUC+SUNAT',entity:'Gob.pe / SUNAT'},{label:'Regímenes tributarios',href:'https://emprender.sunat.gob.pe/ruc/regimenes-tributarios-mype/regimenes-tributarios',entity:'SUNAT'}] },
    { id:'licencia-municipal', step:5, title:'Licencia municipal y seguridad', entity:'Municipalidad', cost:'Según municipalidad y riesgo', duration:'Verificar requisitos locales', description:'Si el negocio opera en un establecimiento, revisa los requisitos de licencia de funcionamiento y las condiciones de seguridad aplicables en la municipalidad correspondiente. La exigencia depende de la actividad, el local y la clasificación de riesgo.', initialStatus:'no-iniciado', appliesToRuc10:true, uploadHint:'Adjunta cargo, licencia o documento municipal', requirements:['Identificar la municipalidad competente para la ubicación del local','Verificar compatibilidad de uso y requisitos de la actividad','Preparar la solicitud y datos del titular o representante','Verificar condiciones y procedimiento ITSE cuando corresponda','Consultar tasa y documentación vigentes en la municipalidad'], links:[{label:'Licencia de funcionamiento',href:'https://www.gob.pe/busquedas?term=licencia+de+funcionamiento',entity:'Gob.pe'},{label:'Información sobre ITSE',href:'https://www.gob.pe/busquedas?term=ITSE',entity:'Gob.pe'}] }
  ],
  initialDocuments: [
    {id:'demo-1',name:'dni_referencial.pdf',sizeKb:420,stageId:'reserva-nombre',uploadedAt:'Demo · 12 oct 2026',demo:true},
    {id:'demo-2',name:'constancia_reserva.pdf',sizeKb:316,stageId:'reserva-nombre',uploadedAt:'Demo · 14 oct 2026',demo:true},
    {id:'demo-3',name:'datos_aportes.pdf',sizeKb:204,stageId:'acto-constitutivo',uploadedAt:'Demo · 15 oct 2026',demo:true}
  ],
  officialGuides: [
    {label:'Abrir o hacer negocio',href:'https://www.gob.pe/263-abrir-o-hacer-negocio',entity:'Gob.pe / PRODUCE',description:'Orientación general para iniciar y formalizar un negocio.'},
    {label:'Constitución de empresas',href:'https://www.gob.pe/busquedas?term=constituir+empresa',entity:'Gob.pe / SUNARP',description:'Consulta los pasos y canales disponibles para constituir una persona jurídica.'},
    {label:'Regímenes tributarios',href:'https://emprender.sunat.gob.pe/ruc/regimenes-tributarios-mype/regimenes-tributarios',entity:'SUNAT',description:'Revisa las características de los regímenes tributarios.'},
    {label:'Licencia de funcionamiento',href:'https://www.gob.pe/busquedas?term=licencia+de+funcionamiento',entity:'Gob.pe / Municipalidad',description:'Identifica la orientación oficial sobre licencias y requisitos municipales.'}
  ],
  navItems: [
    {id:'progreso',label:'Mi Progreso',shortLabel:'Progreso',icon:'list-checks'},
    {id:'boveda',label:'Bóveda de documentos',shortLabel:'Bóveda',icon:'folder-lock'},
    {id:'guias',label:'Guías oficiales',shortLabel:'Guías',icon:'book-open'}
  ]
};
export { DATA };
