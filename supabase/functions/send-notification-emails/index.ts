import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  reservationId: string;
  eventType: 'created' | 'updated' | 'deleted';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reservationId, eventType }: EmailNotificationRequest = await req.json();

    console.log(`Processing email notifications for reservation ${reservationId}, event: ${eventType}`);

    // Get reservation details
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select(`
        *,
        rooms (name, code),
        courses (name, code),
        profiles!created_by (full_name, email)
      `)
      .eq('id', reservationId)
      .single();

    if (reservationError || !reservation) {
      console.error('Error fetching reservation:', reservationError);
      throw new Error('Reservation not found');
    }

    // Get notification recipients
    const { data: recipients, error: recipientsError } = await supabase
      .rpc('get_notification_recipients', { reservation_id: reservationId });

    if (recipientsError) {
      console.error('Error fetching recipients:', recipientsError);
      throw new Error('Failed to fetch recipients');
    }

    console.log(`Found ${recipients.length} recipients`);

    // Prepare email content
    const subject = `Reserva de Sala - ${getEventTypeText(eventType)}`;
    const eventText = getEventTypeText(eventType);
    const creatorName = reservation.profiles?.full_name || 'Usuario';
    const roomName = reservation.rooms?.name || 'Sala no especificada';
    const courseName = reservation.courses?.name || null;

    const startDate = new Date(reservation.start_datetime).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const startTime = new Date(reservation.start_datetime).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const endTime = new Date(reservation.end_datetime).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Send emails to recipients
    const emailPromises = recipients.map(async (recipient: any) => {
      const personalizedMessage = getPersonalizedMessage(
        recipient.role,
        eventText,
        reservation.title,
        creatorName,
        courseName
      );

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff;">
            <h2 style="color: #333; margin: 0 0 16px 0;">${subject}</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
              Hola ${recipient.full_name},
            </p>
            <p style="color: #666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
              ${personalizedMessage}
            </p>
          </div>
          
          <div style="background-color: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; margin-top: 20px;">
            <h3 style="color: #333; margin: 0 0 16px 0;">Detalles de la Reserva</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Título:</td>
                <td style="padding: 8px 0; color: #333;">${reservation.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Fecha:</td>
                <td style="padding: 8px 0; color: #333;">${startDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Horario:</td>
                <td style="padding: 8px 0; color: #333;">${startTime} - ${endTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Sala:</td>
                <td style="padding: 8px 0; color: #333;">${roomName}</td>
              </tr>
              ${courseName ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Curso:</td>
                  <td style="padding: 8px 0; color: #333;">${courseName}</td>
                </tr>
              ` : ''}
              ${reservation.description ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Descripción:</td>
                  <td style="padding: 8px 0; color: #333;">${reservation.description}</td>
                </tr>
              ` : ''}
            </table>
          </div>
          
          <div style="margin-top: 20px; padding: 16px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              Este es un mensaje automático del Sistema de Reservas de Salas.
            </p>
          </div>
        </div>
      `;

      return resend.emails.send({
        from: "Sistema de Reservas <reservas@resend.dev>",
        to: [recipient.email],
        subject: subject,
        html: emailHtml,
      });
    });

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Email notification results: ${successful} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successful, 
        failed: failed 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification-emails function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function getEventTypeText(eventType: string): string {
  switch (eventType) {
    case 'created': return 'Nueva Reserva';
    case 'updated': return 'Reserva Modificada';
    case 'deleted': return 'Reserva Cancelada';
    default: return 'Actualización de Reserva';
  }
}

function getPersonalizedMessage(
  role: string, 
  eventText: string, 
  title: string, 
  creatorName: string, 
  courseName: string | null
): string {
  const courseText = courseName ? ` para el curso "${courseName}"` : '';
  
  switch (role) {
    case 'professor':
      return `Se ha registrado una ${eventText.toLowerCase()}: "${title}"${courseText}. Como profesor del curso, te notificamos sobre esta actualización en el horario.`;
    case 'student':
      return `Se ha registrado una ${eventText.toLowerCase()}: "${title}"${courseText}. Como estudiante inscrito, te mantenemos informado sobre los cambios en el horario de clases.`;
    case 'admin':
    case 'coordinator':
      return `Se ha registrado una ${eventText.toLowerCase()}: "${title}" creada por ${creatorName}${courseText}. Como ${role === 'admin' ? 'administrador' : 'coordinador'}, recibes esta notificación para tu conocimiento.`;
    default:
      return `Se ha registrado una ${eventText.toLowerCase()}: "${title}" por ${creatorName}${courseText}.`;
  }
}

serve(handler);