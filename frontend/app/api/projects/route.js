import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Project from "@/models/Project";
import { requireAuth, requireRole } from "@/lib/middleware";

export async function GET(request) {
  await dbConnect();
  const user = await requireAuth(request);

  try {
    const projects = await Project.find({}).populate("directorId", "name email");
    return NextResponse.json({ projects }, { status: 200 });
  } catch (error) {
    if (error.statusCode === 401) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  await dbConnect();
  const user = await requireRole(request, ["admin", "director"]);

  try {
    const { name, description, directorId, startDate, endDate, budget, status, priority } = await request.json();
    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Le nom du projet est obligatoire" }, { status: 400 });
    }
    const cleanName = name.trim();
    const numBudget = budget ? parseFloat(budget) : 0;
    if (numBudget < 0) {
      return NextResponse.json({ error: "Le budget ne peut pas être négatif" }, { status: 400 });
    }

    const existing = await Project.findOne({ name: cleanName });
    if (existing) {
      return NextResponse.json({ error: "Un projet avec ce nom existe déjà" }, { status: 409 });
    }

    // Build project data - only include directorId if it's provided and not empty
    const projectData = { 
      name: cleanName, 
      description,
      startDate: startDate || null,
      endDate: endDate || null,
      budget: numBudget,
      status: status || 'planning',
      priority: priority || 'medium'
    };
    if (directorId && directorId.trim() !== "") {
      projectData.directorId = directorId;
    }

    console.log('[API /projects POST] Creating project with data:', projectData);

    const project = await Project.create(projectData);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('[API /projects POST] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  await dbConnect();
  const user = await requireRole(request, ["admin", "director"]);

  try {
    const { id, name, description, directorId, startDate, endDate, budget, status, priority } = await request.json();
    if (!id || !name || name.trim() === "") {
      return NextResponse.json({ error: "L'id et le nom du projet sont obligatoires" }, { status: 400 });
    }
    const cleanName = name.trim();
    const numBudget = budget ? parseFloat(budget) : 0;
    if (numBudget < 0) {
      return NextResponse.json({ error: "Le budget ne peut pas être négatif" }, { status: 400 });
    }

    const existing = await Project.findOne({ name: cleanName, _id: { $ne: id } });
    if (existing) {
      return NextResponse.json({ error: "Un projet avec ce nom existe déjà" }, { status: 409 });
    }

    const projectData = { 
      name: cleanName, 
      description: description || "",
      startDate: startDate || null,
      endDate: endDate || null,
      budget: numBudget,
      status: status || 'planning',
      priority: priority || 'medium'
    };
    if (directorId && directorId.trim() !== "") {
      projectData.directorId = directorId;
    } else {
      projectData.directorId = null;
    }

    const updatedProject = await Project.findByIdAndUpdate(id, projectData, { new: true }).populate("directorId", "name email");
    if (!updatedProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project: updatedProject }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  await dbConnect();
  const user = await requireRole(request, ["admin", "director"]);

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing project id" }, { status: 400 });
    }

    const deletedProject = await Project.findByIdAndDelete(id);
    if (!deletedProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Project deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
