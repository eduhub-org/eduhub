# Automatic labeling of branches that are checked out

Copy the `post-checkout` script into the folder `.git/hools`. All branches that are checked out are then added by a lable at the beginning of the branch name corresponding the label of the issue number given in the branch name (if present).