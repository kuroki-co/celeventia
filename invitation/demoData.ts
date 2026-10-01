import type { WeddingInvitationContent } from "./renderer/types";

export const previewWeddingDemoContent: WeddingInvitationContent = {
  heroImage:
    "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1800&q=82",
  galleryImages: [
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=82",
    "https://images.unsplash.com/photo-1529634597503-139d3726fed5?auto=format&fit=crop&w=1200&q=82",
  ],
  tagline: "Y si, elegimos celebrar este amor con ustedes.",
  family: {
    intro: "Con la bendicion de nuestras familias",
    groomParents: ["Carlos Mendoza", "Rosa Salinas"],
    brideParents: ["Jorge Torres", "Maria Elena Vargas"],
    godparents: ["Roberto Linares", "Patricia Vargas"],
    witnesses: ["Eduardo Castillo", "Lucia Rios"],
  },
  saveTheDate: {
    month: "Noviembre",
    day: "14",
    weekday: "Sabado",
    message:
      "Guarda esta fecha para acompaniarnos en el inicio de una historia que queremos celebrar cerca de quienes amamos.",
  },
  locations: [
    {
      kind: "Ceremonia religiosa",
      name: "Parroquia San Jose",
      date: "14 de noviembre de 2026",
      time: "5:00 p.m.",
      address: "Av. El Rosario 245, Lima",
      mapUrl: "https://maps.google.com",
      image:
        "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=82",
    },
    {
      kind: "Recepcion",
      name: "Casa Hacienda Moreyra",
      date: "14 de noviembre de 2026",
      time: "7:30 p.m.",
      address: "Av. Paz Soldan 290, San Isidro",
      mapUrl: "https://maps.google.com",
      image:
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=82",
    },
  ],
  itinerary: [
    {
      time: "5:00 p.m.",
      title: "Ceremonia",
      description: "Nos encontramos para celebrar el si mas importante.",
    },
    {
      time: "7:30 p.m.",
      title: "Recepcion",
      description: "Cocktail de bienvenida y primeros brindis.",
    },
    {
      time: "9:00 p.m.",
      title: "Cena",
      description: "Una mesa preparada para compartir historias y alegria.",
    },
    {
      time: "10:30 p.m.",
      title: "Baile",
      description: "Abrimos la pista con nuestra cancion favorita.",
    },
  ],
  dressCode: {
    style: "Formal elegante",
    men: "Terno oscuro, camisa clara y zapatos formales.",
    women: "Vestido largo o cocktail en tonos suaves o profundos.",
    children: "Ropa formal comoda para acompanar la celebracion.",
    avoidColors: ["Blanco", "Marfil", "Rojo intenso"],
  },
  gifts: [
    {
      title: "Sobre",
      description:
        "Habra un buzon en la recepcion para quienes prefieran entregar un sobre.",
    },
    {
      title: "Yape",
      description: "Andrea Mendoza - 999 000 000",
    },
    {
      title: "Transferencia",
      description: "BCP - Cuenta de ahorros soles 194-1234567-0-12",
    },
  ],
  story: [
    {
      date: "2019",
      title: "Nos conocimos",
      description:
        "Una conversacion sencilla se convirtio en el comienzo de todo.",
      image:
        "https://images.unsplash.com/photo-1494774157365-9e04c6720e47?auto=format&fit=crop&w=1000&q=82",
    },
    {
      date: "2022",
      title: "Nuestro primer hogar",
      description:
        "Aprendimos que el amor tambien vive en los detalles de cada dia.",
      image:
        "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1000&q=82",
    },
    {
      date: "2025",
      title: "La propuesta",
      description:
        "Dijimos si con la certeza de querer caminar juntos lo que venga.",
      image:
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=82",
    },
  ],
  closingMessage:
    "Gracias por ser parte de esta historia.\nSu presencia hará que este día\nsea aún más nuestro.",
};
