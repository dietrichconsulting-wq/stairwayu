export interface Career {
  title: string
  salary: string
  growth: string
  description: string
  majors: string[]
}

export interface InterestTag {
  id: string
  label: string
  emoji: string
  careers: Career[]
}

export const INTEREST_TAGS: InterestTag[] = [
  {
    id: "design-creative",
    label: "Design & Creative",
    emoji: "🎨",
    careers: [
      { title: "UX Designer", salary: "$85,000", growth: "+16%", description: "Design digital experiences for applications, websites, and software products.", majors: ["Art & Design", "Graphic Design", "Computer Science", "Information Systems"] },
      { title: "Architect", salary: "$93,310", growth: "+5%", description: "Plan and design buildings, structures, and spaces for clients.", majors: ["Architecture", "Environmental Design", "Urban Planning"] },
      { title: "Graphic Designer", salary: "$57,990", growth: "+3%", description: "Create visual concepts to communicate ideas that inspire and captivate.", majors: ["Graphic Design", "Art & Design", "Communications"] },
      { title: "Art Director", salary: "$105,180", growth: "+6%", description: "Develop design concepts and presentation approaches for media and campaigns.", majors: ["Art & Design", "Film & Media Studies", "Graphic Design", "African American Studies"] },
      { title: "Interior Designer", salary: "$61,590", growth: "+4%", description: "Make indoor spaces functional, safe, and beautiful using space requirement planning.", majors: ["Art & Design", "Architecture", "Environmental Design"] }
    ]
  },
  {
    id: "technology",
    label: "Technology",
    emoji: "💻",
    careers: [
      { title: "Software Engineer", salary: "$132,270", growth: "+25%", description: "Develop and maintain software systems, applications, and core technological infrastructure.", majors: ["Computer Science", "Software Engineering", "Computer Engineering", "Mathematics"] },
      { title: "Data Scientist", salary: "$103,500", growth: "+35%", description: "Extract insights from complex data sets using statistical and computational techniques.", majors: ["Data Science", "Statistics", "Computer Science", "Mathematics"] },
      { title: "Cybersecurity Analyst", salary: "$112,000", growth: "+32%", description: "Protect an organization's computer networks and systems from digital threats.", majors: ["Information Technology", "Computer Science", "Information Systems"] },
      { title: "AI/ML Engineer", salary: "$136,620", growth: "+21%", description: "Build and deploy artificial intelligence models and machine learning pipelines.", majors: ["Computer Science", "Data Science", "Software Engineering"] },
      { title: "Product Manager", salary: "$117,110", growth: "+10%", description: "Guide the strategy, development, and launch of technology products and services.", majors: ["Business Administration", "Information Systems", "Management", "Computer Science", "Supply Chain Management"] }
    ]
  },
  {
    id: "science-research",
    label: "Science & Research",
    emoji: "🔬",
    careers: [
      { title: "Research Scientist", salary: "$100,000", growth: "+11%", description: "Design and conduct experiments to test theories and discover scientific principles.", majors: ["Biology", "Chemistry", "Physics", "Biochemistry"] },
      { title: "Lab Director", salary: "$111,000", growth: "+6%", description: "Manage laboratory operations, oversee research projects, and ensure protocol compliance.", majors: ["Chemistry", "Biology", "Health Sciences", "Veterinary / Pre-Vet", "Chemical Engineering"] },
      { title: "Environmental Consultant", salary: "$76,480", growth: "+6%", description: "Advise companies on minimizing environmental impact and complying with regulations.", majors: ["Environmental Science", "Civil Engineering", "Public Policy", "Agriculture"] },
      { title: "Biotech Researcher", salary: "$99,830", growth: "+9%", description: "Develop new products and processes based on biological systems.", majors: ["Biochemistry", "Biology", "Biomedical Engineering", "Chemical Engineering"] }
    ]
  },
  {
    id: "healthcare",
    label: "Healthcare",
    emoji: "🏥",
    careers: [
      { title: "Doctor", salary: "$229,300", growth: "+3%", description: "Diagnose and treat illnesses, injuries, and health conditions in patients.", majors: ["Medicine / Pre-Med", "Biology", "Chemistry", "Health Sciences", "Dental Hygiene"] },
      { title: "Nurse Practitioner", salary: "$121,610", growth: "+38%", description: "Provide primary and specialty healthcare, including writing prescriptions and diagnosing illness.", majors: ["Nursing", "Health Sciences", "Dental Hygiene"] },
      { title: "Physical Therapist", salary: "$97,720", growth: "+15%", description: "Help patients improve movement and manage pain after injuries or illness.", majors: ["Kinesiology", "Exercise Science", "Health Sciences"] },
      { title: "Pharmacist", salary: "$132,750", growth: "+3%", description: "Dispense prescription medications and offer expertise in the safe use.", majors: ["Pharmacy / Pre-Pharmacy", "Chemistry", "Biochemistry"] },
      { title: "Public Health Director", salary: "$104,830", growth: "+12%", description: "Plan, direct, and coordinate medical and health services at community levels.", majors: ["Public Health", "Health Sciences", "Public Policy"] }
    ]
  },
  {
    id: "business-finance",
    label: "Business & Finance",
    emoji: "📊",
    careers: [
      { title: "Investment Banker", salary: "$150,000", growth: "+7%", description: "Help corporate clients raise capital and provide strategic financial advice.", majors: ["Finance", "Economics", "Business Administration"] },
      { title: "Marketing Director", salary: "$140,040", growth: "+6%", description: "Plan advertising and promotional campaigns to generate interest in products.", majors: ["Marketing", "Business Administration", "Communications"] },
      { title: "Management Consultant", salary: "$93,000", growth: "+10%", description: "Advise organizations on how to improve their efficiency and profitability.", majors: ["Management", "Economics", "Finance", "Business Administration", "Industrial Engineering", "Hospitality Management"] },
      { title: "Financial Analyst", salary: "$96,220", growth: "+8%", description: "Guide businesses and individuals in making investment decisions and assessing performance.", majors: ["Finance", "Accounting", "Economics"] },
      { title: "Entrepreneur", salary: "$120,000", growth: "+5%", description: "Start, operate, and assume the risks of new business ventures and startups.", majors: ["Business Administration", "Management", "Marketing", "Real Estate", "Agriculture", "Supply Chain Management"] }
    ]
  },
  {
    id: "law-policy",
    label: "Law & Policy",
    emoji: "⚖️",
    careers: [
      { title: "Attorney", salary: "$135,740", growth: "+8%", description: "Advise and represent individuals, businesses, or government agencies on legal issues.", majors: ["Law / Pre-Law", "Political Science", "History", "English", "Philosophy", "Spanish"] },
      { title: "Policy Analyst", salary: "$81,590", growth: "+7%", description: "Evaluate government programs, analyze data, and propose legislative solutions.", majors: ["Public Policy", "Political Science", "Economics", "International Relations"] },
      { title: "Lobbyist", salary: "$92,000", growth: "+6%", description: "Persuade legislators and government officials to enact policies beneficial to organizations.", majors: ["Political Science", "Communications", "Public Policy"] },
      { title: "Judge", salary: "$148,030", growth: "+2%", description: "Apply the law and oversee the legal process in court proceedings.", majors: ["Law / Pre-Law", "Political Science", "Criminal Justice"] },
      { title: "Compliance Officer", salary: "$71,690", growth: "+4%", description: "Ensure an organization strictly adheres to internal policies and regulatory requirements.", majors: ["Business Administration", "Law / Pre-Law", "Accounting", "Finance", "Criminal Justice"] }
    ]
  },
  {
    id: "environment-sustainability",
    label: "Environment & Sustainability",
    emoji: "🌍",
    careers: [
      { title: "Environmental Engineer", salary: "$96,530", growth: "+4%", description: "Use engineering, biology, and chemistry principles to solve environmental problems.", majors: ["Environmental Science", "Civil Engineering", "Biomedical Engineering", "Chemical Engineering"] },
      { title: "Urban Planner", salary: "$78,500", growth: "+4%", description: "Develop land use plans to create communities and accommodate population growth.", majors: ["Urban Planning", "Environmental Design", "Public Policy"] },
      { title: "Conservation Scientist", salary: "$64,460", growth: "+4%", description: "Manage, improve, and protect natural resources like forests and state parks.", majors: ["Environmental Science", "Agriculture", "Biology", "Animal Science"] },
      { title: "Sustainability Director", salary: "$105,000", growth: "+10%", description: "Develop and execute strategies to improve organizational sustainability and reduce footprint.", majors: ["Environmental Science", "Business Administration", "Management"] }
    ]
  },
  {
    id: "writing-media",
    label: "Writing & Media",
    emoji: "📝",
    careers: [
      { title: "Journalist", salary: "$55,960", growth: "-3%", description: "Investigate stories and report news events to the public across various media.", majors: ["Journalism", "Communications", "English", "Foreign Languages"] },
      { title: "Content Strategist", salary: "$74,000", growth: "+6%", description: "Plan, write, and manage digital content to meet compelling business objectives.", majors: ["Communications", "Marketing", "English", "Linguistics"] },
      { title: "Film Producer", salary: "$85,320", growth: "+7%", description: "Oversee the financial, logistical, and creative aspects of film and media production.", majors: ["Film & Media Studies", "Communications", "Business Administration"] },
      { title: "Author", salary: "$73,150", growth: "+4%", description: "Develop original written content for books, magazines, scripts, and online publications.", majors: ["English", "Journalism", "Liberal Arts", "Linguistics"] },
      { title: "PR Director", salary: "$119,860", growth: "+6%", description: "Manage public image and communications strategies for organizations or public figures.", majors: ["Communications", "Marketing", "Journalism", "Hospitality Management"] }
    ]
  },
  {
    id: "people-society",
    label: "People & Society",
    emoji: "🧠",
    careers: [
      { title: "Psychologist", salary: "$85,330", growth: "+6%", description: "Study cognitive, emotional, and social processes to understand human behavior.", majors: ["Psychology", "Sociology", "Social Work", "Linguistics"] },
      { title: "Social Worker", salary: "$55,350", growth: "+7%", description: "Help people cope with challenges and improve their overall well-being and lives.", majors: ["Social Work", "Psychology", "Sociology", "Religious Studies"] },
      { title: "Teacher", salary: "$63,680", growth: "+4%", description: "Educate students in academic, social, and motor skills in school settings.", majors: ["Education", "English", "Mathematics", "History", "Spanish"] },
      { title: "HR Director", salary: "$130,000", growth: "+5%", description: "Oversee recruiting, interviewing, hiring, and employee relations for an organization.", majors: ["Human Resources", "Business Administration", "Psychology"] },
      { title: "Sociologist", salary: "$92,910", growth: "+5%", description: "Study society, social institutions, and organizational behavior through research and data.", majors: ["Sociology", "Anthropology", "Psychology", "Public Policy", "African American Studies"] }
    ]
  },
  {
    id: "engineering",
    label: "Engineering",
    emoji: "🏗️",
    careers: [
      { title: "Mechanical Engineer", salary: "$96,310", growth: "+10%", description: "Design, develop, build, and test mechanical and thermal sensors and devices.", majors: ["Mechanical Engineering", "Industrial Engineering", "Aerospace Engineering"] },
      { title: "Civil Engineer", salary: "$89,940", growth: "+5%", description: "Design, build, and supervise infrastructure projects and systems globally.", majors: ["Civil Engineering", "Environmental Design", "Urban Planning"] },
      { title: "Aerospace Engineer", salary: "$122,270", growth: "+6%", description: "Design and construct aircraft, spacecraft, satellites, and missile defense systems.", majors: ["Aerospace Engineering", "Mechanical Engineering", "Computer Engineering"] },
      { title: "Biomedical Engineer", salary: "$97,410", growth: "+5%", description: "Combine engineering principles with medical sciences to design and create equipment.", majors: ["Biomedical Engineering", "Health Sciences", "Mechanical Engineering"] },
      { title: "Electrical Engineer", salary: "$103,390", growth: "+3%", description: "Design, develop, test, and supervise the manufacturing of electrical equipment.", majors: ["Electrical Engineering", "Computer Engineering", "Physics"] }
    ]
  },
  {
    id: "arts-performance",
    label: "Arts & Performance",
    emoji: "🎭",
    careers: [
      { title: "Actor", salary: "$60,000", growth: "+3%", description: "Express ideas and portray characters in theater, film, television, and media.", majors: ["Theater", "Performing Arts", "Film & Media Studies"] },
      { title: "Musician", salary: "$60,000", growth: "+1%", description: "Perform music for live audiences and recordings across varying genres.", majors: ["Music", "Performing Arts"] },
      { title: "Choreographer", salary: "$50,990", growth: "+6%", description: "Create new dance routines and direct rehearsals for performances.", majors: ["Performing Arts", "Theater"] },
      { title: "Creative Director", salary: "$100,000", growth: "+6%", description: "Lead communication and visual design projects across media and corporate campaigns.", majors: ["Art & Design", "Graphic Design", "Film & Media Studies"] },
      { title: "Arts Administrator", salary: "$70,000", growth: "+5%", description: "Manage business operations and public relations for cultural organizations and nonprofits.", majors: ["Business Administration", "Management", "Performing Arts"] }
    ]
  },
  {
    id: "sports-health",
    label: "Sports & Health",
    emoji: "🏅",
    careers: [
      { title: "Athletic Trainer", salary: "$53,840", growth: "+14%", description: "Prevent, diagnose, and treat muscle and bone injuries and illnesses.", majors: ["Kinesiology", "Exercise Science", "Sports Management"] },
      { title: "Sports Manager", salary: "$80,000", growth: "+7%", description: "Handle the business operations of sports facilities, teams, or athletic departments.", majors: ["Sports Management", "Business Administration", "Management"] },
      { title: "Physical Therapist", salary: "$97,720", growth: "+15%", description: "Help patients improve movement and manage pain after injuries or illness.", majors: ["Kinesiology", "Exercise Science", "Health Sciences"] },
      { title: "Nutritionist", salary: "$66,450", growth: "+7%", description: "Advise people on what to eat in order to lead a healthy lifestyle.", majors: ["Nutrition", "Health Sciences", "Kinesiology"] },
      { title: "Coach", salary: "$44,890", growth: "+9%", description: "Teach amateur or professional athletes the skills they need to succeed.", majors: ["Sports Management", "Kinesiology", "Education"] }
    ]
  },
  {
    id: "literature",
    label: "Literature",
    emoji: "📚",
    careers: [
      { title: "Editor", salary: "$73,080", growth: "+5%", description: "Review, rewrite, and edit content for books, journals, and digital publications.", majors: ["English", "Liberal Arts", "Journalism", "Communications"] },
      { title: "Literary Agent", salary: "$78,000", growth: "+4%", description: "Represent authors and negotiate publishing contracts on their behalf.", majors: ["English", "Communications", "Business Administration"] },
      { title: "Professor of Literature", salary: "$83,480", growth: "+8%", description: "Teach and conduct research in literary analysis, theory, and criticism at the university level.", majors: ["English", "Comparative Literature", "Liberal Arts", "Philosophy"] },
      { title: "Librarian", salary: "$61,190", growth: "+5%", description: "Curate collections, assist patrons with research, and manage library programs and services.", majors: ["English", "Liberal Arts", "History", "Information Systems"] },
      { title: "Technical Writer", salary: "$78,060", growth: "+7%", description: "Create clear documentation, manuals, and guides for complex products and processes.", majors: ["English", "Communications", "Journalism", "Computer Science"] }
    ]
  },
  {
    id: "history",
    label: "History",
    emoji: "🏛️",
    careers: [
      { title: "Historian", salary: "$68,930", growth: "+3%", description: "Research, analyze, and interpret the past through primary sources and archives.", majors: ["History", "Anthropology", "Political Science", "African American Studies"] },
      { title: "Museum Curator", salary: "$60,110", growth: "+12%", description: "Manage collections, design exhibits, and preserve cultural artifacts for public education.", majors: ["History", "Art & Design", "Anthropology", "Liberal Arts"] },
      { title: "Archivist", salary: "$61,400", growth: "+9%", description: "Appraise, organize, and preserve historically valuable documents and records.", majors: ["History", "Liberal Arts", "Information Systems"] },
      { title: "Foreign Service Officer", salary: "$105,000", growth: "+6%", description: "Represent national interests abroad through diplomacy, policy analysis, and cultural exchange.", majors: ["History", "International Relations", "Political Science", "Foreign Languages"] },
      { title: "Documentary Filmmaker", salary: "$82,000", growth: "+7%", description: "Research and produce nonfiction films that explore historical events and social issues.", majors: ["History", "Film & Media Studies", "Journalism", "Communications"] }
    ]
  },
  {
    id: "languages",
    label: "Languages",
    emoji: "🌐",
    careers: [
      { title: "Translator", salary: "$57,090", growth: "+19%", description: "Convert written material from one language to another while preserving meaning and tone.", majors: ["Foreign Languages", "Spanish", "Linguistics", "Comparative Literature"] },
      { title: "Interpreter", salary: "$62,510", growth: "+19%", description: "Facilitate real-time spoken communication between people who speak different languages.", majors: ["Foreign Languages", "Spanish", "Linguistics"] },
      { title: "Linguist", salary: "$85,000", growth: "+6%", description: "Study the structure, history, and evolution of languages through scientific analysis.", majors: ["Linguistics", "Foreign Languages", "Anthropology", "Philosophy"] },
      { title: "ESL Instructor", salary: "$59,720", growth: "+5%", description: "Teach English language skills to non-native speakers in academic and professional settings.", majors: ["Linguistics", "English", "Education", "Foreign Languages"] },
      { title: "Localization Manager", salary: "$95,000", growth: "+10%", description: "Adapt products, content, and services for international markets and diverse audiences.", majors: ["Foreign Languages", "Linguistics", "Marketing", "Communications"] }
    ]
  }
]
